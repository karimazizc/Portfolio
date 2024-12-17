import simplefix
import socket
import time
import random
from datetime import datetime
import threading
from enum import Enum
import re


class OrderType(Enum):
    MARKET = "1"
    LIMIT = "2"

class OrderSide(Enum):
    BUY = "1"
    SELL = "2"
    SHORT = "5"

class FIXClient:
    def __init__(self):
        # Connection settings
        self.host = "fix.dytechlab.com"
        self.port = 5100
        self.sender_comp_id = "OPS_CANDIDATE_10_8372"
        self.target_comp_id = "DTL"
        self.seq_num = 1
        self.socket = None
        self.parser = simplefix.FixParser()
        self.is_logged_on = False
        self.heartbeat_interval = 30
        self.last_heartbeat = time.time()

    def connect(self):
        """Establish connection and initiate FIX session"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            print(f"Connected to {self.host}:{self.port}")
            
            # Start heartbeat and message receiver threads
            threading.Thread(target=self.heartbeat_sender, daemon=True).start()
            threading.Thread(target=self.message_receiver, daemon=True).start()
            
            # Send logon message
            self.send_logon()
            
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    def send_logon(self):
        """Send Logon message"""
        logon = simplefix.FixMessage()
        logon.append_pair(8, "FIX.4.2")
        logon.append_pair(35, "A")  # MsgType = Logon
        logon.append_pair(49, self.sender_comp_id)
        logon.append_pair(56, self.target_comp_id)
        logon.append_pair(34, self.seq_num)
        logon.append_pair(52, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        logon.append_pair(98, 0)  # EncryptMethod = None
        logon.append_pair(108, self.heartbeat_interval)  # HeartBeatInterval
        
        self.send_message(logon)
        print("Logon message sent")

    def send_heartbeat(self):
        """Send Heartbeat message"""
        heartbeat = simplefix.FixMessage()
        heartbeat.append_pair(8, "FIX.4.2")
        heartbeat.append_pair(35, "0")  # MsgType = Heartbeat
        heartbeat.append_pair(49, self.sender_comp_id)
        heartbeat.append_pair(56, self.target_comp_id)
        heartbeat.append_pair(34, self.seq_num)
        heartbeat.append_pair(52, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        
        self.send_message(heartbeat)

    def send_new_order(self, symbol, side, order_type, quantity, price=None):
        """Send New Order Single message"""
        order = simplefix.FixMessage()
        order.append_pair(8, "FIX.4.2")
        order.append_pair(35, "D")  # MsgType = New Order Single
        order.append_pair(49, self.sender_comp_id)
        order.append_pair(56, self.target_comp_id)
        order.append_pair(34, self.seq_num)
        order.append_pair(52, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        
        # Order details
        order.append_pair(11, f"ORD{int(time.time()*1000)}")  # ClOrdID
        order.append_pair(21, "1")  # HandlInst = Automated
        order.append_pair(55, symbol)  # Symbol
        order.append_pair(54, side.value)  # Side
        order.append_pair(40, order_type.value)  # OrdType
        order.append_pair(38, quantity)  # OrderQty
        if price and order_type == OrderType.LIMIT:
            order.append_pair(44, price)  # Price
        order.append_pair(60, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])  # TransactTime
        
        self.send_message(order)
        print(f"New order sent: {symbol} {side.name} {quantity} @ {price if price else 'MARKET'}")

    def send_cancel_request(self, original_order_id, symbol, side):
        """Send Order Cancel Request"""
        cancel = simplefix.FixMessage()
        cancel.append_pair(8, "FIX.4.2")
        cancel.append_pair(35, "F")  # MsgType = Cancel Request
        cancel.append_pair(49, self.sender_comp_id)
        cancel.append_pair(56, self.target_comp_id)
        cancel.append_pair(34, self.seq_num)
        cancel.append_pair(52, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        
        cancel.append_pair(41, original_order_id)  # OrigClOrdID
        cancel.append_pair(11, f"CXLORD{int(time.time()*1000)}")  # ClOrdID
        cancel.append_pair(55, symbol)  # Symbol
        cancel.append_pair(54, side.value)  # Side
        cancel.append_pair(60, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])  # TransactTime
        
        self.send_message(cancel)
        print(f"Cancel request sent for order: {original_order_id}")

    def send_message(self, message):
        """Send a FIX message"""
        try:
            msg_bytes = message.encode()
            self.socket.send(msg_bytes)
            self.seq_num += 1
            print(f"Sent: {msg_bytes.decode('utf-8').replace(chr(1), '|')}")
        except Exception as e:
            print(f"Error sending message: {e}")

    def heartbeat_sender(self):
        """Thread to send heartbeats"""
        while True:
            if self.is_logged_on and time.time() - self.last_heartbeat > self.heartbeat_interval:
                self.send_heartbeat()
                self.last_heartbeat = time.time()
            time.sleep(1)

    def message_receiver(self):
        """Thread to receive and process messages"""
        buffer = b""
        
        while True:
            try:
                data = self.socket.recv(4096)
                if not data:
                    print("Connection closed by server")
                    break
                
                
                buffer += data
                data_string = []
                
                
                while b"\x01" in buffer:
                    
                    msg_end = buffer.find(b"\x01") + 1
                    
                    msg = buffer[:msg_end]
                    
                    buffer = buffer[msg_end:]
                    
                    message = msg.decode('utf-8').replace(chr(1), '|')   
                    
                    data_string.append(message)
                    self.process_message(msg)

                print(f'Message Recieved: {"".join(data_string)}\n')
            except Exception as e:
                print(f"Error receiving message: {e}")
                break

    def process_message(self, msg_bytes):
        """Process received FIX message"""
        try:
            self.parser.append_buffer(msg_bytes)
            msg = self.parser.get_message()
            if not msg:
                return
            
            msg_type = msg.get(35)
            
            if msg_type == b"A":  # Logon
                self.is_logged_on = True
                print("Logged on successfully")
            elif msg_type == b"8":  # Execution Report
                self.handle_execution_report(msg)
            elif msg_type == b"3":  # Reject
                print(f"Message rejected: {msg.get(58)}")
            elif msg_type == b"9":  # Order Cancel Reject
                print(f"Cancel rejected: {msg.get(58)}")
                
        except Exception as e:
            print(f"Error processing message: {e}")

    def handle_execution_report(self, msg):
        """Handle execution report messages"""
        exec_type = msg.get(150)
        symbol = msg.get(55)
        quantity = msg.get(38)
        price = msg.get(31)
        order_id = msg.get(11)
        
        if exec_type == b"0":  # New
            print(f"Order {order_id} accepted")
        elif exec_type == b"2":  # Filled
            print(f"Order {order_id} filled: {quantity}@{price}")
        elif exec_type == b"4":  # Cancelled
            print(f"Order {order_id} cancelled")
        elif exec_type == b"8":  # Rejected
            print(f"Order {order_id} rejected")

def main():
    client = FIXClient()
    if not client.connect():
        return

    # Wait for logon confirmation
    time.sleep(2)
    
    if not client.is_logged_on:
        print("Failed to log on")
        return

    symbols = ["MSFT", "AAPL", "BAC"]
    orders_sent = 0
    start_time = time.time()
    order_ids = []

    try:
        # Send 1000 orders for each symbol
        while orders_sent < 3000 and time.time() - start_time < 300:  # 5 minutes
            symbol = random.choice(symbols)
            side = random.choice(list(OrderSide))
            order_type = random.choice(list(OrderType))
            quantity = random.randint(100, 1000)
            
            if order_type == OrderType.LIMIT:
                # Random price ±2% from reference prices
                reference_prices = {"MSFT": 405.0, "AAPL": 175.0, "BAC": 35.0}
                base_price = reference_prices[symbol]
                price = round(base_price * random.uniform(0.98, 1.02), 2)
            else:
                price = None
            
            # Send new order
            client.send_new_order(symbol, side, order_type, quantity, price)
            orders_sent += 1
            
            # Random delay between orders (100-500ms)
            time.sleep(random.uniform(1, 5))

    except KeyboardInterrupt:
        print("\nStopping...")
        
    finally:
        client.socket.close()

if __name__ == "__main__":
    main()