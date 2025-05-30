import simplefix
import socket
import time
import random
from datetime import datetime
import threading
from enum import Enum
from collections import defaultdict
from typing import Dict, List
from functools import wraps

class OrderType(Enum):
    MARKET = "1"
    LIMIT = "2"

class OrderSide(Enum):
    BUY = "1"
    SELL = "2"
    SHORT = "5"

# Timer decorater
def timer(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()

        result = func(*args, **kwargs)

        end_time = time.time() - start_time 

        print(f"{func.__name__} took {round(end_time, 2)} seconds, {round(end_time/60,2)} minutes")
        
        return result
    return wrapper

class OrderStatus:
    def __init__(self, symbol: str, side: OrderSide, quantity: int, price: float = None):
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
    
    def add_trade(self, symbol: str, side: OrderSide, quantity: int, price: float):        
        trade_value = quantity * price
        self.total_volume_usd += trade_value
        self.trades_by_symbol[symbol].append((quantity, price))

        if side in [OrderSide.SELL, OrderSide.SHORT]:
            self.total_pnl += trade_value
        else:
            self.total_pnl -= trade_value
    
    def get_vwap(self, symbol: str) -> float:
        trades = self.trades_by_symbol[symbol]
        if not trades:
            return 0
        total_quantity = sum(qty for qty, _ in trades)
        total_value = sum(qty * price for qty, price in trades)
        return total_value / total_quantity if total_quantity > 0 else 0

class FIXClient:
    def __init__(self, host="fix.dytechlab.com", port=5100,
                 sender_comp_id="OPS_CANDIDATE_10_8372",
                 target_comp_id="DTL"):
        self.host = host
        self.port = port
        self.sender_comp_id = sender_comp_id
        self.target_comp_id = target_comp_id

        self.seq_num = 1
        self.socket = None
        self.parser = simplefix.FixParser()
        self.is_logged_on = False
        self.heartbeat_interval = 30
        self.last_heartbeat = time.time()

        self.orders: Dict[str, OrderStatus] = {}
        self.orders_by_symbol = defaultdict(int)
        self.stats = TradeStatistics()

    def describe_value(self, code, get_full:bool= True) -> list:
        """description of each values""" 
                
        key_value = {
                8: "Version",
                9: "Body Length",
                11: "OrderID",
                35: {
                    "": "MsgType",
                    "A": "Logon",
                    "D": "NewOrder or Market Order msg type",
                    "F": "Order Cancel Request",
                    0: "Heartbeat",
                    3: "Reject Order",
                    8: "Execution Report",
                    9: "Order Cancel Reject"
                },
                34: "Sequence Number",
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
            if code in [35, 40]:
                for idx, keys in enumerate(key_value[code]):   
                    if keys == "": 
                        print(f"tag {code} is the field's message type (MsgType)") 
                    else:
                        print(f"{keys} in tag {code} represent {list(key_value[code].values())[idx]}")
            else:
                value = key_value[code]
                print(f"Tag {code} is the message's {value}")
                if get_full:
                    return key_value
        else:
            print("Tag not found")
            if get_full:
                return key_value
            
    
    def start_connection(self):
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

    def standard_header(self, msg_type: str):
        standard = simplefix.FixMessage()
        standard.append_pair(8, "FIX.4.2")
        standard.append_pair(35, msg_type)
        standard.append_pair(49, self.sender_comp_id)
        standard.append_pair(56, self.target_comp_id)
        standard.append_pair(34, self.seq_num)
        standard.append_pair(52, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        return standard

    def send_logon(self):
        logon = self.standard_header("A")
        logon.append_pair(98, 0)
        logon.append_pair(108, self.heartbeat_interval)
        self.send_message(logon)
        print("Logon message sent")

    def send_heartbeat(self):
        heartbeat = self.standard_header("0")
        self.send_message(heartbeat)

    def send_new_order(self, symbol, side, order_type, quantity, price=None):
        order_id = f"ORD{int(time.time()*1000)}"
        order = self.standard_header("D")
        order.append_pair(11, order_id)
        order.append_pair(21, "1")
        order.append_pair(55, symbol)
        order.append_pair(54, side.value)
        order.append_pair(40, order_type.value)
        order.append_pair(38, quantity)
        if price and order_type == OrderType.LIMIT:
            order.append_pair(44, price)
        order.append_pair(60, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])

        self.orders[order_id] = OrderStatus(symbol, side, quantity, price)
        self.orders_by_symbol[symbol] += 1

        self.send_message(order)
        print(f"New order sent: {symbol} {side.name} {quantity} @ {price if price else 'MARKET'}")
        return order_id

    def send_cancel_request(self, original_order_id, symbol, side):
        cancel = self.standard_header("F")
        cancel.append_pair(41, original_order_id)
        cancel.append_pair(11, f"CXLORD{int(time.time()*1000)}")
        cancel.append_pair(55, symbol)
        cancel.append_pair(54, side.value)
        cancel.append_pair(60, datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        self.send_message(cancel)
        print(f"Cancel request sent for order: {original_order_id}")

    def send_message(self, message):
        try:
            msg_bytes = message.encode()
            self.socket.send(msg_bytes)
            self.seq_num += 1
            print(f"Sent: {msg_bytes.decode('utf-8').replace(chr(1), '|')}")
        except Exception as e:
            print(f"Error sending message: {e}")

    def heartbeat_sender(self):
        while True:
            if self.is_logged_on and time.time() - self.last_heartbeat > self.heartbeat_interval:
                self.send_heartbeat()
                self.last_heartbeat = time.time()
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
                message_list = []
                while b"\x01" in buffer:
                    msg_end = buffer.find(b"\x01") + 1
                    msg = buffer[:msg_end]
                    buffer = buffer[msg_end:]
                    message = msg.decode('utf-8').replace(chr(1), '|')

                    message_list.append(message)
                    if "10=" in message:
                        message_list.append("/")
                    self.process_message(msg)
                full_message = "".join(message_list).split("/")

                for message in full_message:
                    print(f"Recieved: {message}")
                    print(f"Recieved {len(full_message)} messages")

            except Exception as e:
                
                print(f"Error receiving message: {e}")
                break

    def process_message(self, msg_bytes):
        try:
            self.parser.append_buffer(msg_bytes)
            msg = self.parser.get_message()
            if not msg:
                return
            
            msg_type = msg.get(35)
            
            if msg_type == b"A":
                self.is_logged_on = True
                print("Successfully logged on")
            elif msg_type == b"8":
                self.handle_execution_report(msg)
            elif msg_type == b"3":
                print(f"Message rejected: {msg.get(58)}")
            elif msg_type == b"9":
                print(f"Cancel rejected: {msg.get(58)}")
        except Exception as e:
            print(f"Error processing message: {e}")

    def handle_execution_report(self, msg):
        exec_type = msg.get(150)
        order_id = msg.get(11).decode()

        if order_id not in self.orders:
            print(f"Unknown order ID: {order_id}")
            return
        
        order = self.orders[order_id]

        if exec_type == b"0":
            order.status = "ACCEPTED"
            print(f"Order {order_id} accepted")
        elif exec_type == b"2":
            fill_qty = int(msg.get(32))
            fill_price = float(msg.get(31))
            
            order.filled_quantity += fill_qty
            order.fills.append((fill_qty, fill_price))
            
            self.stats.add_trade(order.symbol, order.side, fill_qty, fill_price)
            
            order.status = "FILLED" if order.filled_quantity >= order.quantity else "PARTIALLY_FILLED"
            print(f"Order {order_id} filled: {fill_qty} @ ${fill_price}")
        elif exec_type == b"8":
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

@timer
def main():
    client = FIXClient()
    if not client.start_connection():
        return
    time.sleep(2)

    if not client.is_logged_on:
        print("Failed to log on")
        return
    
    symbols = ["MSFT", "AAPL", "BAC"]
    orders_by_symbol = defaultdict(int)
    active_orders = {}
    start_time = time.time()

    try:
        while time.time() - start_time < 300:
            for symbol in symbols:
                if orders_by_symbol[symbol] < 1000:
                    side = random.choice(list(OrderSide))
                    order_type = random.choice(list(OrderType))
                    quantity = random.randint(100, 1000)

                    if order_type == OrderType.LIMIT:
                        reference_prices = {"MSFT": 405.0, "AAPL": 175.0, "BAC": 35.0}
                        base_price = reference_prices[symbol]
                        price = round(base_price * random.uniform(0.98, 1.02), 2)
                    else:
                        price = None

                    order_id = client.send_new_order(symbol, side, order_type, quantity, price)
                    orders_by_symbol[symbol] += 1
                    active_orders[order_id] = time.time()

            current_time = time.time()
            for order_id, order_time in list(active_orders.items()):
                if current_time - order_time > 10 and random.random() < 0.3:
                    order = client.orders.get(order_id)
                    if order and order.status in ["ACCEPTED", "PARTIALLY_FILLED"]:
                        client.send_cancel_request(order_id, order.symbol, order.side)
                        del active_orders[order_id]

            time.sleep(random.uniform(0.1, 0.5))

            if all(count >= 1000 for count in orders_by_symbol.values()):
                break

    except KeyboardInterrupt:
        print("\n ---------------=  STOPPING =---------------\n")

    finally:
        time.sleep(5)
        client.print_statistics()
        client.socket.close()

if __name__ == "__main__":
    main()