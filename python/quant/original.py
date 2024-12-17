import simplefix
import socket
import time
import random
from datetime import datetime
import threading
from enum import Enum
from collections import defaultdict
from typing import Dict, List

class OrderType(Enum):
    MARKET = "1"
    LIMIT = "2"

class OrderSide(Enum):
    BUY = "1"
    SELL = "2"
    SHORT = "5"

class OrderStatus:
    def __init__(self, symbol:str, side:OrderSide, quantity:int, price: float = None):
        self.symbol = symbol
        self.side = side
        self.quantity = quantity
        self.price = price
        self.filled_quantity = 0 
        self.filled_price = 0
        self.status = "NEW"
        self.fills: List[tuple] = []

    

class TradeStatistics:
    def __init__(self):
        self.total_volume_usd = 0
        self.total_pnl = 0
        self.trades_by_symbol = defaultdict(list)
    
    def add_trade(self, symbol:str, side:OrderSide, quantity:int, price: float = None):
        trade_value = quantity * price
        self.total_volume_usd += trade_value
        self.trades_by_symbol[symbol].append((quantity, price))

        if side in [OrderSide.SELL, OrderSide.SHORT]:
            self.total_pnl += trade_value
        else:
            self.total_pnl -= trade_value
    
    def get_vwap(self, symbol:str) -> float:
        trades = self.trades_by_symbol[symbol]
        if not trades:
            return 0
        total_quantity = sum(qty for qty, _ in trades)
        total_value = sum(qty * price for qty, price in trades)
        return total_value / total_quantity if total_quantity > 0 else 0
    
class FIXClient:

    def __init__(self, host = "fix.dytechlab.com", port = 5100,
                sender_comp_id = "OPS_CANDIDATE_10_8372",
                target_comp_id = "DTL"):
        # Connection settings
        self.host = host
        self.port = port
        self.sender_comp_id = sender_comp_id
        self.target_comp_id = target_comp_id

        self.seq_num = 1
        self.socket = None
        self.parser = simplefix.FixParser()
        self.is_logged_on = False
        self.heartbeat_interval = 30
        self.last_hearbeat = time.time()

        self.orders: Dict[str, OrderStatus] = {}
        self.orders_by_symbol = defaultdict(int)
        self.stats = TradeStatistics()
    
    def describe_value(code):
        """description of each values""" 
                
        key_value = {
                8: "Version",
                9: "Body Length",
                11: "OrderID",
                35: {
                    "": "Message Type",
                    "A": "Logon",
                    "D": "NewOrder or Market Order msg type",
                    "F": "Order Cancel Request",
                    3: "Reject Order",
                    8: "Execution Report",
                    9: "Order Cancel Reject"
                },
                34: "Message Sequence Number",
                38: "Quantity Size",
                40: {
                    "": "Order Type",
                    1: "Market Order",
                    2: "Limit Order",
                    3: "Stop Order",
                    4: "Stop Limit Order"
                },
                44: "Price for limit orders",
                52: "Date time string in sending time",
                49: "SenderCompID",
                56: "Destination TargetCompID",
                10: "Checksum",
                98: "Password required",
                108: "Heartbeat Interval",
                21: "HandlInst",
                22: "ID Source",
                23: "SecurityType",
                25: "NumOfOrders",
                27: "SecurityExchange",
                30: "LastShares",
                31: "LastPx",
                32: "LastShares",
                33: "LastTradingDay",
                57: "TargetCompID",
                58: "Text",
                59: "TimeInForce",
                60: "TransactTime",
                65: "Symbol",
                66: "SecurityID",
                70: "Quantity",
                71: "Price",
                76: "Email",
                101: "SecurityReqID"
            }
        
        if code in key_value:
            value = key_value[code]
            print(f"Tag {code} is the message's {value}")
            return value
        else:
            print("Tag not found")
            return None

        return key_value
    
    def start_connection(self):
        """Establish connection to initiate a FIX session"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            print(f"Connected to {self.host}:{self.port}\n")
            
            threading.Thread(target=self.heartbeat_sender, daemon=True).start()
            threading.Thread(target=self.message_receiver, daemon=True).start()
            
            self.send_logon()

            return True
        except Exception as e:
            print(f"Connection Failed: {e}")
            return False
    def standard_header(self, msg_type:str):

        standard = simplefix.FixMessage()
        standard.append_pair(8,"FIX.4.2")
        standard.append_pair(35, msg_type)
        standard.append_pair(49, self.sender_comp_id)
        standard.append_pair(56, self.target_comp_id)
        standard.append_pair(34, self.seq_num)
        standard.append_pair(52, datetime.now().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])

        return standard
    
    def send_logon(self):
        """Using simplefix to send logon message"""
        logon = self.standard_header("A")
        logon.append_pair(98, 0)
        logon.append_pair(108, self.heartbeat_interval)
        
        self.send_message(logon)
        print("Logon message sent")
        

    def send_heartbeat(self):
        heartbeat = self.standard_header("0")
        
        self.send_message(heartbeat)

    def send_cancel_Request(self,original_order_id, symbol, side):
        
        cancel = self.standard_header(msg_type="F")
    
        cancel.append_pair(41, original_order_id)
        cancel.append_pair(11,f"CXLORD{int(time.time()*1000)}")
        cancel.append_pair(55, symbol)
        cancel.append_pair(54, side.value)
        cancel.append_pair(60, datetime.now().strftime("%Y%m%d-%H:%M:%S.%f")[:-3]) #TransactionTime

        self.send_message(cancel)
        print(f"Cancel request sent for order: {original_order_id}")
    
    
    def send_new_order(self, symbol, side, order_type, quantity, price = None):
        
        order_id = f"ORD{int(time.time()*1000)}"
        order = self.standard_header("D")
        order.append_pair(11, order_id) #Order id
        order.append_pair(21, "1") # automated execution, no broker and private
        order.append_pair(55, symbol)
        order.append_pair(54, side.value)
        order.append_pair(40, order_type.value)
        order.append_pair(38, quantity)
        if price and order_type == OrderType.LIMIT:
            order.append_pair(44, price)

        order.append_pair(60, datetime.now().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        self.orders[order_id] = OrderStatus(symbol, side, quantity, price)
        self.orders_by_symbol[symbol] += 1

        self.send_message(order)
        return order_id
    
    def send_message(self,message):
        """sends a fix message"""
        try:
            msg_bytes = message.encode()
            self.socket.send(msg_bytes)
            self.seq_num += 1
            print(f"Sent: {msg_bytes.decode('utf-8').replace(chr(1), '|')}")
        except Exception as e:
            print(f"Error sending message: {e}")

    def heartbeat_sender(self):
        while True:
            if self.is_logged_on and time.time() - self.last_hearbeat > self.heartbeat_interval:
                self.send_heartbeat()
                self.last_hearbeat = time.time()
            time.sleep(1)

    def message_receiver(self):
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
                
                full_message ="".join(data_string) 
                print(full_message)
            except Exception as e:
                print(f"Error recieving message: {e}")
                break
    
    def process_message(self, msg_bytes):
        """Process recieved FIX message"""
        try:
            self.parser.append_buffer(msg_bytes)
            msg = self.parser.get_message()
            if not msg:
                return
            
            msg_type = msg.get(35)

            if msg_type == b"A":
                self.is_logged_on = True

            elif msg_type ==b"8":
                self.handle_execution_report(msg)

            elif msg_type ==b"3":
                print(f"Message rejected: {msg.get(58)}")

            elif msg_type ==b"9":
                print(f"Cancel rejected: {msg.get(58)}")
        except Exception as e:
            print(f"Error processing message: {e}")
    
    def handle_execution_report(self,msg):
        
        exec_type = msg.get(150)
        order_id = msg.get(11).decode()

        if order_id not in self.orders:
            print(f"Unknown order ID: {order_id}")
            return
        order = self.orders[order_id]

        if exec_type == b"0": # NEW ORDER
            order.status = "ACCEPTED"
            print(f"Order {order_id} accepted")

        elif exec_type == b"2": # FILLED order
            fill_qty = int(msg.get(32))
            fill_price = float(msg.get(31))

            order.filled_quantity += fill_qty
            order.fills.append((fill_qty, fill_price))
            order.status = "FILLED" if order.filled_quantity >= order.quantity else "PARTIALLY_FILLED"
        elif exec_type == b"8": # Rejected 
            order.status = "REJECTED"
            print(f"Order {order_id} rejected")

    def print_statistics(self):
        print("\n=== Trading Statistics ===")
        print(f"Total Trading Volume: ${self.stats.total_volume_usd:,.2f}")
        print(f"Total PNL: ${self.stats.total_pnl:,.2f}")
        print("\nVWAP by Symbol:")
        for symbol in ["MSFT", "AAPL", "BAC"]:
            vwap = self.stats.get_vwap(symbol)
            print(f"{symbol}: ${vwap:,.2f}")
        print("\nOrders by Symbol:")
        for symbol, count in self.orders_by_symbol.items():
            print(f"{symbol}: {count} orders")

def main():
    client = FIXClient()
    if not client.start_connection():
        return
    time.sleep(2)

    if not client.is_logged_on:
        print(f"Failed to log on")
        return
    
    symbols = ["MSFT", "AAPL", "BAC"]
    orders_by_symbol = defaultdict(int)
    active_orders = {}
    start_time = time.time()

    try:
        while time.time() - start_time < 300:

            for symbol in symbols:
                if orders_by_symbol[symbols] < 1000:
                    side = random.choice(list(OrderSide))
                    order_type = random.choice(list(OrderType))
                    quantity = random.randint(100,1000)

                    if order_type == OrderType.LIMIT:
                        reference_prices = {"MSFT":405.0, "AAPL":175.0,"BAC":35.0}
                        base_price = reference_prices[symbol]
                        price = round(base_price * random.uniform(0.98, 1.02),2)
                    else:
                        price = None

                    order_id = client.send_new_order(symbol, side, order_type, quantity, price)
                    orders_by_symbol[symbol] += 1
                    active_orders[order_id] = time.time()

            current_time = time.time()

            for order_id, order_time in list(active_orders.items()):
                if current_time - order_time > 10 and random.random() <  0.3:
                    order = client.orders.get(order_id)
                    if order and order.status in ["ACCEPTED", "PARTIALLY_FILLED"]:
                        client.send_cancel_Request(order_id, order.symbol, order.side)
                        del active_orders[order_id]

            time.sleep(random.uniform(0.1, 0.5))

            if all(count >= 1000 for count in orders_by_symbol.values()):
                break
                
    except KeyboardInterrupt:
        print("================================================\nSTOPPING ================================================\n")

    finally:
        time.sleep(5)
        client.print_statistics()
        client.socket.close()

if __name__ == "__main__":
    main()
    