from stocker.indicators.ChangeRate import *

# get peaks by price change rate percent. for every period of time where change rate is above zero consecutively - look for 1 peak.
# than for every period of time where change rate is below zero consecutively - look for 1 valley.
# source - a basic interval record. see stock.py
# distance - parameter for the price change rate calculation - specifying how many candles for each change rate calculation.
def PeaksByChangeRate(source,attr='close',distance=3):
    # first get a list of sorted candle keys
    SourceList = sorted(source['data'])
    
    # also make sure the candles change rate is marked.
    AddChangeRateToCandleList(source['data'],attr,distance)
    
    # now go over candles and find peaks.
    # reset index (0 is irrelevant)
    candleIndex = 1
    
    # do we start high or low?
    edgeSearch = 'peak' if source['data'][SourceList[candleIndex]]['ChangeRate%'] > 0 else 'valley'
    
    # set current candle to current edge value since it is the first candle.
    currentEdge = source['data'][SourceList[candleIndex]]['high'] if edgeSearch == 'peak' else source['data'][SourceList[candleIndex]]['low']
    
    # set current edge index as this is the first candle.
    currentEdgeIndex = candleIndex
    
    # next candle please
    candleIndex += 1
    
    while candleIndex < len(SourceList):
        # get the direction of the current candle by change rate.
        candleEdgeSearch = 'peak' if source['data'][SourceList[candleIndex]]['ChangeRate%'] > 0 else 'valley'
        
        # get the edge of this candle.
        candleEdge = source['data'][SourceList[candleIndex]]['high'] if candleEdgeSearch == 'peak' else source['data'][SourceList[candleIndex]]['low']
        
        # if we have changed direction - set the peak or valley and reset search vars
        if candleEdgeSearch != edgeSearch:
            # add previously found edge to the edge list.
            #define edge
            edge = {
                    'edge':True,                        # candle edges define the valley. edge must be more extreme than the 2 neighbouring candels
                    'trender':True,                     # did this valley cause the trend to flip (from prices going down to prices going up.)
                    'candleIndex':currentEdgeIndex,     # candle index can help use measure how much influence this valley had later on.
                    'type':edgeSearch,
                    'value':currentEdge
                    }
            # add edge to proper lists
            source[edgeSearch+'s'][SourceList[currentEdgeIndex]] = edge
            source['edges'][SourceList[currentEdgeIndex]] = edge
            lastEdge = edge
                
            # reset vars for new direction
            # searching a different edge
            edgeSearch = candleEdgeSearch
            # new edge value
            currentEdge = candleEdge
            # new edge index
            currentEdgeIndex = candleIndex
            
        # still on same direction. check if current candle is the new current edge candle
        elif (candleEdge >= currentEdge and edgeSearch == 'peak') or (candleEdge <= currentEdge and edgeSearch == 'valley'):
            # update current found edge and index
            currentEdge = candleEdge
            currentEdgeIndex = candleIndex
        
        # next candle please.
        candleIndex += 1
        
    # add last edge to edge list.
    #define edge
    edge = {
                'edge':True,                        # candle edges define the valley. edge must be more extreme than the 2 neighbouring candels
                'trender':True,                     # did this valley cause the trend to flip (from prices going down to prices going up.)
                'candleIndex':currentEdgeIndex,     # candle index can help use measure how much influence this valley had later on.
                'type':edgeSearch,
                'value':currentEdge
            }
            
    # add edge to proper lists
    source[edgeSearch+'s'][SourceList[currentEdgeIndex]] = edge
    source['edges'][SourceList[currentEdgeIndex]] = edge
    lastEdge = edge
    