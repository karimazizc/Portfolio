import time 
from datetime import datetime
import socket
import threading
import simplefix
def calculate_checksum(message):
    """
    Calculate the checksum for a FIX message.
    
    Args:
    message (str): The FIX message string (without the checksum field).
    
    Returns:
    int: The checksum value (mod 256).
    """
    total = sum(ord(c) for c in message)
    checksum = total % 256
    return str(checksum).zfill(3)

class FIXClient:

    """
    Fix Protocol Client-side Application :
    This application follows fix protcol version 4.2
     
    Args:
     HeartBtInt(108): Heartbeat interval in seconds (default = 30)
     Password(98): Password input
     Ticker(55): stock to trade
    """
    
    RUNNING = False
    SEQ_NUM = 1

    def __init__(self, host, port, sender_comp_id, target_comp_id) -> None:
        self.host = host
        self.port = port
        self.sender_comp_id = sender_comp_id
        self.target_comp_id = target_comp_id
        self.socket = None
        self.parser = simplefix.FixParser()
        self.is_logged_on = False
        self.heartbeat_interval = 30
        self.last_heartbeat = time.time()
       
    def connect(self):
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            print(f"Connected to {self.host}:{self.port}")

            # start heartbeat and send message


            # send logon message


            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False
        

    def log_on(self, HeartBtInt,) -> None:
        FIXClient.RUNNING = True

        print("Session starting...")
        print(f" - Trading in heartbeat interval of {HeartBtInt} seconds")
        print("\n \n \n")
        while FIXClient.RUNNING:
            time.sleep(30)
     
            print("35=0")
    def log_off(self) -> None: 
        if not FIXClient.RUNNING:
            print("Session hasn't started yet...")
        elif FIXClient.RUNNING:
            print("Session closing...")
    
    def create_message(self, msg_type, sessionFields):
        base_fields = {
            '8': 'FIX.4.2',
            '35': msg_type,
            '49': self.SenderCompID,
            '56': self.TargetCompID,
            '34': str(self.seq_num),
            '52': datetime.now().strftime("%Y%m%d-%H:%M:%S")
        }
        sessionFields(base_fields)

        msg = '|'.join(f"{k}={v}" for k, v in sorted(base_fields.items()))
        msg = msg.replace('|', '\x01')
        
        length = len(msg)
        msg = f"8=FIX.4.2\x019={length}\x01" + msg
        
        checksum = calculate_checksum(msg)
        msg += f"\x0110={checksum}\x01"
        
        return msg
    

    
    def order():
        pass

    def quote():
        pass

    def quote_request():
        pass

    def new_order():
        pass

    def new_order():
        pass


if __name__ == "__main__":
    HOST = "fix.dytechlab.com"
    PORT = 5100
    SENDER_COMP_ID = "OPS_CANDIDATE_10_8372"
    TARGET_COMP_ID = "DTL"
    FIXClient(host=HOST, 
           port= 5100, 
           SenderCompID= 'OPS_CANDIDATE_10_8372',
           TargetCompID= TARGET_COMP_ID).create_message('A',)