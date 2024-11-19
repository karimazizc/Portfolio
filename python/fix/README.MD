# Using python 3.11.5

# What is a fix protocol?

Financial Information Exchange

a rule set of Financial Information Exchange.


# FIX is a Key Value Pair protocol

I have a key of 35 = C

KEY = VALUE 
Key Value pair information.

Alot of key value pair.

# FIX -> It parses FIX messages

### ---------------------------------

# Session Layer:

## Logon

## Logoff

## Heartbeat

## Session Level Reject

## Business Level Reject

### ----------------------------------

# Application Layer:

## New Order

## Order Cancel Request

## Quote Request

## Mass Quote

## Mass Quote Cancel

## Quote Cancel

## Exec Report - Fill Notice

## Exec Report - Elimination

## Security Definition 

## New Order Cross

## Order Status Request

## Security Definition Request

# ---------------- EXAMPLE MESSAGE VERSION 4.2

LOGON
Message dump:
8=FIX.4.2|9=74|35=A|34=978|49=TESTSELL3|52=20190206-16:29:19.208|56=TESTBUY3|98=0|108=60|10=137

LOGOUT
Message dump:
8=FIX.4.2|9=62|35=5|34=977|49=TESTSELL3|52=20190206-16:28:51.518|56=TESTBUY3|10=092

# Info
Standard Header ----

8 = Version

9 = BodyLength
 9=110 -> body length is 110

11 = OrderID
 11=1412 = order id of 1412

35 = Message Type 
 35=A -> log on message
 35=D -> new order or market order
 35=F -> order cancel request
 35=3 -> reject order
 35=8 -> Execution Report
 35=9 -> Order Cancel reject

34 = Message Sequence Number
 34=978 -> Message sequence number, this is the 978 message

38 = Quantity size
 38=100 -> order stock quantity of 100

40 = Order type
 40=1 -> market order
 40=2 -> limit order
 40=3 -> stop order
 40=4 -> stop limit order

44 = Price (for limit orders)


49 = SenderCompID 
 49=CLIENTSELL

52 = Datetime string in sending time 
 52=20190206-16:29:19.208 -> 2019-02-06 at 16:29:19.208

54 = Side order, buy(1) or sell(2)
 54=1 -> buy stock
 54=2 -> sell stock
 54=3 -> buy to cover
 54=4 -> sell short

55 = Order Ticker
 55=GOOG -> symbol ticker for google

56 = Destination TargetCompID, identifying reciever
    this could be another trading system, broker or counterparty
 56=SERVER -> SERVER is the recipient

10 = Checksum, 3dgit value for message integriy
 10=092 -> 092 checksum

98 = Password required
 98=0 -> no password required

108 = Heartbeat Interval
 108=60 -> heartbeat interval of 60 seconds

