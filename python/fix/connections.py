import socket
import time
import random

# Helper function to calculate the checksum
def calculate_checksum(message):
    checksum = sum(ord(char) for char in message) % 256
    return f"{checksum:03}"

# Helper function to create a FIX message
def create_fix_message(fields):
    message = "|".join(f"{key}={value}" for key, value in fields)
    body_length = len(message) + 1  # +1 for the delimiter
    header = f"8=FIX.4.2|9={body_length}|"
    full_message = header + message + "|"
    checksum = calculate_checksum(full_message)
    return full_message + f"10={checksum}|"

# Function to create a logon message
def create_logon_message():
    fields = [
        ("35", "A"),  # MsgType: Logon
        ("34", "1"),  # MsgSeqNum
        ("49", "OPS_CANDIDATE_10_8372"),  # SenderCompID
        ("56", "DTL"),  # TargetCompID
        ("98", "0"),  # EncryptMethod: None
        ("108", "30")  # HeartBtInt: 30 seconds
    ]
    return create_fix_message(fields)

# Function to create a new order message
def create_new_order_message(seq_num):
    fields = [
        ("35", "D"),  # MsgType: New Order Single
        ("34", str(seq_num)),  # MsgSeqNum
        ("49", "OPS_CANDIDATE_10_8372"),  # SenderCompID
        ("56", "DTL"),  # TargetCompID
        ("11", str(random.randint(100000, 999999))),  # ClOrdID
        ("21", "1"),  # HandlInst: Automated execution
        ("55", random.choice(["MSFT", "AAPL", "BAC"])),  # Symbol
        ("54", str(random.choice([1, 2, 5]))),  # Side: Buy (1), Sell (2), Short Sell (5)
        ("38", "100"),  # OrderQty
        ("40", "2"),  # OrdType: Limit
        ("44", f"{random.uniform(100, 200):.2f}"),  # Price
        ("59", "0")  # TimeInForce: Day
    ]
    return create_fix_message(fields)

# Main function to run the FIX client
def main():
    host = "fix.dytechlab.com"
    port = 5100
    seq_num = 1

    # Create a TCP/IP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((host, port))
    print(f"Connected to {host} on port {port}")

    # Send the logon message
    logon_message = create_logon_message()
    sock.send(logon_message.replace("|", "\x01").encode())
    print("Sent logon message")

    # Receive the response
    response = sock.recv(4096)
    print("Received:", response.decode().replace("\x01", "|"))

    # Send random orders for 5 minutes
    start_time = time.time()
    while time.time() - start_time < 300:
        order_message = create_new_order_message(seq_num)
        sock.send(order_message.replace("|", "\x01").encode())  # Using send instead of sendall
        print(f"Sent order {seq_num}")

        # Receive and print the response
        response = sock.recv(4096)
        print("Received:", response)

        seq_num += 1
        time.sleep(random.uniform(0.1, 1))  # Random interval between 0.1 and 1 second

    # Close the socket
    sock.close()

if __name__ == "__main__":
    main()
