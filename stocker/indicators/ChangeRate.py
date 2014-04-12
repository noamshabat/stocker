
# simple calculation of the rate of change between 2 numbers.
def GetChangeRatePercent(newval,oldval):
    return (newval/oldval)*100 - 100
    
# source - a dicitonary of date keys that contain candle objects.
# attr - the attribute to calculate the change rate on - open / close / high  / low...
# distance - distance between old candle and new candle for calculating change rate.
def AddChangeRateToCandleList(source,attr='close',distance=1):
    # sort source list (list is expected to be candles by date..)
    SourceList = sorted(source)
    
    # for each candle - calculate the change in percentage from first candle.
    for index in range(0,len(SourceList)):
        # newval for calculating rate change - always current index.
        newval = source[SourceList[index]][attr]
        # set old index for getting oldval for calculating rate of change. when index < diff this will be 0.
        oldindex = index-distance if index>=distance else 0
        # get oldval
        oldval = source[SourceList[oldindex]][attr]
        # set percent of change.
        source[SourceList[index]]['ChangeRate%'] = GetChangeRatePercent(newval,oldval)
        
# when looking only for the change rate of a specific date.
def GetChangeRateForDate(source,date,attr='close',diff=1):
    # sort source list (list is expected to be candles by date..)
    SourceList = sorted(source)
    
    newIndex = SourceList.index(date)
    oldIndex = newIndex - diff if newIndex >= diff else 0
    
    return GetChangeRatePercent(source[SourceList[newIndex]][attr],source[SourceList[oldIndex]][attr])
    
