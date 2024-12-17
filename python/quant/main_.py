import simplefix
import socket
import time
import random
from datetime import datetime
import threading
from enum import Enum

class FIXClient:
    """
    Client side FIX Protocol Application 
    """

    VERSION = "FIX.42"

    # Connection Settings
    def __init__(self, 
                 host = "fix.dytechlab.com", 
                 port = 5100, 
                 sender_comp_id = "OPS_CANDIDATE_10_8372", 
                 target_comp_id = "DTL", 
                 heartbeat_interval = 30) -> None:
        self.host = host
        self.port = port
        self.sender_comp_id = sender_comp_id
        self.target_comp_id = target_comp_id
        self.heartbeat_interval = heartbeat_interval
        self.socket = None
        self.parser = simplefix.FixParser()
        self.is_logged_on = False
        self.last_heartbeat = time.time()
        self.seq_num = 1

    def __str__(self):
        return f"This application uses {FIXClient.VERSION} version connecting using the socket library and parses messages through the simplefix library"
    
    def connecting(self):
        """
        Connect and initiate a FIX Session
        """
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            print(f"Connected to {self.host}:{self.port}")
            return True
        except Exception as e:
            print(f"[ERROR] Connection failed: {e}")
            return False
    
    def send_message(self,message):
        "Send FIX message through socket"
        try:
            msg_bytes = message.encode()
            self.socket.send(msg_bytes)
            self.seq_num+= 1
            print(f"sent{msg_bytes.decode('utf-8').replace(chr(1),'|')}")
        except Exception as e:
            print(f"[ERROR] Sending message: {e}")

    def log_on(self) -> simplefix.FixMessage:
        logon = simplefix.FixMessage()
        logon.append_pair(8, FIXClient.VERSION)
        logon.append_pair(35, "A")
        logon.append_pair(49, self.sender_comp_id)
        logon.append_pair(56, self.target_comp_id)
        logon.append_pair(34, self.seq_num)
        logon.append_pair(52, datetime.now().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        logon.append_pair(98, 0)
        logon.append_pair(108, self.heartbeat_interval)
        
        return logon
    
    def heart_beat(self) -> simplefix.FixMessage:
        heartbeat = simplefix.FixMessage()
        heartbeat.append_pair(8, FIXClient.VERSION)
        heartbeat.append_pair(35, "0")  
        heartbeat.append_pair(49, self.sender_comp_id)
        heartbeat.append_pair(56, self.target_comp_id)
        heartbeat.append_pair(34, self.seq_num)
        heartbeat.append_pair(52, datetime.now().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        
        return heartbeat

    def new_order(self, symbol, side, order_type, quantity, price = None):
        """ New Order """
        # Standard
        order = simplefix.FixMessage()
        order.append_pair(8, FIXClient.VERSION)
        order.append_pair(35, "0")  
        order.append_pair(49, self.sender_comp_id)
        order.append_pair(56, self.target_comp_id)
        order.append_pair(34, self.seq_num)
        order.append_pair(52, datetime.now().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        
        #order details
        order.append_pair(11, f"ORDER{int(time.time())}")
        order.append_pair(21, "1")
        order.append_pair(55, symbol)
        order.append_pair(54, side)
        order.append_pair(40, order_type)  # OrdType
        order.append_pair(38, quantity)  # OrderQty
        order.append_pair(44, price)

        
        print(f"New order sent: {symbol} {side.name} {quantity} @ {price if price else 'MARKET'}")

        return order
    
    def heartbeat_sender(self):
        while True:
            if self.is_logged_on and time.time() - self.last_heartbeat > self.heartbeat_interval:
                self.heart_beat()
                self.last_heartbeat = time.time()
            time.sleep(1)
    
    def recieve_message(self):
        buffer = b""

        while True:
            try:
                data = self.socket.recv(4096)
                print(data)
            except Exception as e:
                print(f"ERROR: {e}")
                break
    
    
    
OrderSide = {"BUY":"1",
        "SELL":"2",
        "SHORT":"5"}

OrderType = {
    "MARKET":"1",
    "LIMIT":"2"
}

symbols = ["MSFT", "AAPL", "BAC"]

orders_sent = 0

start_time = time.time()
if __name__ == "__main__":
    client = FIXClient()
    client.connecting()
    time.sleep(1)

    if not client.is_logged_on:
        print("Failed to log on")
    else:
        try:
            while orders_sent < 3000 and time.time() - start_time < 300:
                symbol = random.choice(symbols)
                side = random.choice(list(OrderSide))
        except Exception as e:
            print("failed")

    

