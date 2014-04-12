
from datetime import date,timedelta
from pprint import pprint
from stocker.criterias.edges.byChangeRate import *

class Stock:
    def __init__(self,symbol):
        self.symbol = symbol
        
        self.daily = self.BasicIntervalRecord()
        self.weekly = self.BasicIntervalRecord()
        self.monthly = self.BasicIntervalRecord()
        self.yearly = self.BasicIntervalRecord()
        
        return None
    
    def BasicIntervalRecord(self):
        return {
            'first':None,
            'last':None,
            'data':{},
            'valleys':{},
            'peaks':{},
            'edges':{}
            }
            
    def PutDailyData(self,data):
        self.daily['data'].update(data)
            
        # creating a sorted list aside
        dailyTemp = sorted(self.daily['data'])
        
        # find the first and last day available to us.
        first = dailyTemp[0].split("-")
        self.daily['first'] = date(int(first[0]),int(first[1]),int(first[2]))
        last = dailyTemp[len(dailyTemp)-1].split("-")
        self.daily['last'] = date(int(last[0]),int(last[1]),int(last[2]))
        
        # we may have new days. update weeks.
        self.UpdateWeeks()
        
        
    def UpdateWeeks(self):
        # set week as first available day
        currWeek = self.daily['first']
        # test if we already have weeks - start from latest.
        if self.weekly['last'] is not None:
            currWeek = self.weekly['last'] + timedelta(weeks=1)
        
        # first day is the first day of our week.
        currDay = currWeek
            
        # make sure we go over all available days
        while ( currDay <= self.daily['last'] ):
            # saturdays and fridays do not count.
            if currDay.weekday() > 4 or currDay.isoformat() not in self.daily['data']:
                currDay = currDay + timedelta(days=1)
                continue
            
            # find last day of the week of current day (friday is the last day).
            weekFriday = currDay + timedelta(days=(4-currDay.weekday()))
            
            # if weekly record already exists - skip over it.
            if weekFriday.isoformat() in self.weekly:
                currDay = currDay + timedelta(days=1)
                continue
            
            # if friday is larger than the last day - ignore this week as it is not finished yet.
            if weekFriday > self.daily['last']:
                break
            
            # we are at the first day of the week - build the week record for it.
            weekRecord = {
                'open':self.daily['data'][currDay.isoformat()]['open'],
                'close':self.daily['data'][currDay.isoformat()]['close'],
                'low':self.daily['data'][currDay.isoformat()]['low'],
                'high':self.daily['data'][currDay.isoformat()]['high'],
                'volume':self.daily['data'][currDay.isoformat()]['volume']
                    }
            currDay = currDay + timedelta(days=1)
            
            while ( currDay <= weekFriday ):
                if currDay.isoformat() in self.daily['data']:
                    # fill in week record data
                    # always set close as the last day of the week is the close.
                    weekRecord['close'] = self.daily['data'][currDay.isoformat()]['close']
                    # high and low are min and max of all days.
                    weekRecord['high'] = max(weekRecord['high'],self.daily['data'][currDay.isoformat()]['high'])
                    weekRecord['low'] = min(weekRecord['low'],self.daily['data'][currDay.isoformat()]['low'])
                    # volume is aggregated.
                    weekRecord['volume'] += self.daily['data'][currDay.isoformat()]['volume']
                
                # go to next day.
                currDay = currDay + timedelta(days=1)
            
            # insert record to weekly 
            self.weekly['data'][weekFriday.isoformat()] = weekRecord
        
        # mark first and last week
        weeklyTemp = sorted(self.weekly['data'])
        
        # find the first and last week available to us.
        first = weeklyTemp[0].split("-")
        self.weekly['first'] = date(int(first[0]),int(first[1]),int(first[2]))
        last = weeklyTemp[len(weeklyTemp)-1].split("-")
        self.weekly['last'] = date(int(last[0]),int(last[1]),int(last[2]))
        
        # get edges (peaks and valleys) 
        #self.MarkPeaksValleys2(self.weekly)
        PeaksByChangeRate(self.weekly,'close',5)
        
    # system for marking peaks and valleys:
    # 1. go over candle list and mark for each candle the trend direction it is indicating compared to previous candle: 
    #   1.1 if candle high is higher than previous candle high add one. otherwise if it is lower subtract one.
    #   1.2 if candle low is higher than previous candle high add one. otherwise if it is lower subtract one.
    #   --> according to this candle trend indication can be -2,-1,0,1,2. positive number supports up trend. negative supports down trend.
    #
    # 2. go over entire candle list again. when running into candles with trend indication - mark their active trend as the trend indication. when trend indication is 0 - take the trend indication from
    #    consecutive candles (later dates) - the nearest candle that has a non-zero trend indication sets the trend for all 0 trend indication candles.
    #
    # 3. go over entire candle list again. test each candle trend against the previous candle trend and the next candle trend. if the current candle trend is reversed from the previous - and the next 
    #    maintains the trend as the current - mark this candle as trender.
    
    def MarkPeaksValleys2(self,source):
        ''' Go over weeks and mark the peaks and the valleys '''
        SourceList = sorted(source['data'])
        
        # mark basic trend indication for first candle.
        source['data'][SourceList[0]]['trend-indication'] = 0;
        
        # 1. go over all candles. calculate trend indication.
        for index in range(1,len(SourceList)):
            # get previous item
            lastInterval = source['data'][SourceList[index-1]] if index > 0 else None
            # get current interval,
            thisInterval = source['data'][SourceList[index]]
            
            # set basic trend indication.
            # test lows.
            thisInterval['trend-indication'] = 0
            if lastInterval['low'] > thisInterval['low']:
                thisInterval['trend-indication'] -= 1
            elif lastInterval['low'] < thisInterval['low']:
                thisInterval['trend-indication'] += 1
            
            #test highs
            if lastInterval['high'] > thisInterval['high']:
                thisInterval['trend-indication'] -= 1
            elif lastInterval['high'] < thisInterval['high']:
                thisInterval['trend-indication'] += 1
        
        # 2. go over candle list and set candle trend 
        for index in range(len(SourceList)):
            # get current interval,
            thisInterval = source['data'][SourceList[index]]
            
            # test indication value
            if thisInterval['trend-indication'] > 0:
                thisInterval['candle-trend'] = 1
            elif thisInterval['trend-indication'] < 0:
                thisInterval['candle-trend'] = -1
            else:
                # if indication is 0 - go to next candles and try to set trend according to following candles.
                thisInterval['candle-trend'] = 0
                diff = 1
                while index + diff < len(SourceList):
                    nextCandle = source['data'][SourceList[index+diff]]
                    if nextCandle['trend-indication'] > 0:
                        thisInterval['candle-trend'] = 1
                        break
                    elif nextCandle['trend-indication'] < 0:
                        thisInterval['candle-trend'] = -1
                        break
                    else:
                        diff += 1
            
        lastEdge = None
        # 3. candle trends are marked - check versus next and previous to find peaks.
        for index in range(2,len(SourceList)-2):
            # get previous items
            p1Interval = source['data'][SourceList[index-1]] if index > 0 else None
            p2Interval = source['data'][SourceList[index-2]] if index > 1 else None
            # get next item
            n1Interval = source['data'][SourceList[index+1]] if index < len(SourceList)-1 else None
            n2Interval = source['data'][SourceList[index+2]] if index < len(SourceList)-2 else None
            
            # get current interval,
            cInterval = source['data'][SourceList[index]]
            
            #normalize current candle trend.
            if cInterval['candle-trend'] != p1Interval['candle-trend'] and \
                cInterval['candle-trend'] != p2Interval['candle-trend'] and \
                cInterval['candle-trend'] != n1Interval['candle-trend'] and \
                cInterval['candle-trend'] != n2Interval['candle-trend']:
                    cInterval['candle-trend'] = n2Interval['candle-trend']
                    
            
            # test if valley
            # if cInterval['candle-trend'] < 0 and n1Interval['candle-trend'] > 0 and n2Interval['candle-trend'] > 0 and (lastEdge is None or lastEdge['type'] == 'peak'):
            if p1Interval['low'] > cInterval['low'] and p2Interval['low'] > cInterval['low'] and \
               n1Interval['low'] > cInterval['low'] and n2Interval['low'] > cInterval['low']:
                # c interval is a valley. mark.
                valley = {
                    'edge':True,            # candle edges define the valley. edge must be more extreme than the 2 neighbouring candels
                    #'body':False,           # is body of candle lower (in its base) than the neghbours.
                    'trender':True,        # did this valley cause the trend to flip (from prices going down to prices going up.)
                    'candleIndex':index,  # candle index can help use measure how much influence this valley had later on.
                    'type':'valley',
                    'value':cInterval['low']
                    }
                    
                source['valleys'][SourceList[index]] = valley
                source['edges'][SourceList[index]] = valley
                lastEdge = valley
                
            # test if peak
            #if cInterval['candle-trend'] > 0 and n1Interval['candle-trend'] < 0 and n2Interval['candle-trend'] < 0 and (lastEdge is None or lastEdge['type'] == 'valley'):
            if p1Interval['high'] < cInterval['high'] and p2Interval['high'] < cInterval['high'] and \
               n1Interval['high'] < cInterval['high'] and n2Interval['high'] < cInterval['high']:
                #c interval is a peak. mark.
                peak = {
                    'edge':True,            # candle edges define the peak. edge must be more extreme than the 2 neighbouring candels
                    #'body':False,           # is body of candle higher (in its top) than the neighbours.
                    'trender':True,        # did this peak cause the trend to flip (from prices going up to prices going down.)
                    'candleIndex':index,  # candle index can help use measure how much influence this peak had later on.
                    'type':'peak',
                    'value':cInterval['high']
                    }
                
                source['peaks'][SourceList[index]] = peak
                source['edges'][SourceList[index]] = peak
                lastEdge = peak
                
        
        
    def MarkPeaksValleys1(self,source):
        ''' Go over weeks and mark the peaks and the valleys '''
        SourceList = sorted(source['data'])
        
        for index in range(len(SourceList)):
            # get previous item
            lastInterval = source['data'][SourceList[index-1]] if index > 0 else None
            # get next item
            nextInterval = source['data'][SourceList[index+1]] if index < len(SourceList)-1 else None
            # get current interval,
            thisInterval = source['data'][SourceList[index]]
            
            # test if this is a valley.
            if ( lastInterval is None or lastInterval['low'] >= thisInterval['low'] )  and (nextInterval is not None and nextInterval['low'] >= thisInterval['low']):
                valley = {
                    'edge':True,            # candle edges define the valley. edge must be more extreme than the 2 neighbouring candels
                    'body':False,           # is body of candle lower (in its base) than the neghbours.
                    'trender':False,        # did this valley cause the trend to flip (from prices going down to prices going up.)
                    'candleIndex':index,    # candle index can help use measure how much influence this valley had later on.
                    'type':'valley',
                    'value':thisInterval['low']
                    }
                
                # test if base of body of candle is lower than neighbouring candles.
                thisBase = thisInterval['open'] if thisInterval['open'] < thisInterval['close'] else thisInterval['close']
                lastBase = None if lastInterval is None else lastInterval['open'] if lastInterval['open'] < lastInterval['close'] else lastInterval['close']
                nextBase = None if nextInterval is None else nextInterval['open'] if nextInterval['open'] < nextInterval['close'] else nextInterval['close']
                
                if ( lastBase is None or lastBase >= thisBase ) and ( nextBase is None or nextBase >= thisBase ):
                    valley['body'] = True
                
                source['valleys'][SourceList[index]] = valley
                source['edges'][SourceList[index]] = valley
                
            # similarly, test if this is a peak.
            if ( lastInterval is None or lastInterval['high'] <= thisInterval['high'] )  and (nextInterval is not None and nextInterval['high'] <= thisInterval['high']):
                peak = {
                    'edge':True,            # candle edges define the peak. edge must be more extreme than the 2 neighbouring candels
                    'body':False,           # is body of candle higher (in its top) than the neighbours.
                    'trender':False,        # did this peak cause the trend to flip (from prices going up to prices going down.)
                    'candleIndex':index,     # candle index can help use measure how much influence this peak had later on.
                    'type':'peak',
                    'value':thisInterval['high']
                    }
                
                # test if top of body of candle is higher than neighbouring candles.
                thisTop = thisInterval['open'] if thisInterval['open'] > thisInterval['close'] else thisInterval['close']
                lastTop = None if lastInterval is None else lastInterval['open'] if lastInterval['open'] > lastInterval['close'] else lastInterval['close']
                nextTop = None if nextInterval is None else nextInterval['open'] if nextInterval['open'] > nextInterval['close'] else nextInterval['close']
                
                if ( lastTop is None or lastTop <= thisTop ) and ( nextTop is None or nextTop <= thisTop ):
                    peak['body'] = True
                
                
        
            # go over list of edges, and remove duplicate peaks and vallies:
            # if we have 2 vallies in a row - keep the lower one and delete the other.
            # if we have 2 peaks in a row - keep the higher one and delete the other
            restart = True  # not sure what happens when incrementing in range - better be safe than sorry. restarting whenever deleting from list.
            lastIndex = 1
            while restart:
                restart = False
                sortedBraces = sorted(source['edges'])
                # now go over list and delete when relevant
                for index in range(lastIndex,len(sortedBraces)):
                    # did we find a duplicate entry?
                    if source['edges'][sortedBraces[index]]['type'] == source['edges'][sortedBraces[index-1]]['type']:
                        #duplicate - first mark index and restart
                        lastIndex = index
                        restart = True
                        # is this a valley?
                        if source['edges'][sortedBraces[index]]['type'] == "valley":
                            # who is lower?
                            if source['edges'][sortedBraces[index]]['value'] < source['edges'][sortedBraces[index-1]]['value']:
                                del source['edges'][sortedBraces[index-1]]
                            else:
                                del source['edges'][sortedBraces[index]]
                            break
                        else: # not a valley - must be a peak
                            # who is higher?
                            if source['edges'][sortedBraces[index]]['value'] > source['edges'][sortedBraces[index-1]]['value']:
                                del source['edges'][sortedBraces[index-1]]
                            else:
                                del source['edges'][sortedBraces[index]]
                            break
            
            # go over all peaks and valleys and mark if they are trenders. we define a trend as a series of at least 3 candles.
            # if a peak or a valley comes right after a valley or peak accordingly, than it is just a small and temporary fluctuation. we will not want to 
            # treat these fluctuations as trends.
            if len(sortedBraces) > 0:
                source['edges'][sortedBraces[0]]['trender'] = True
                for index in range(1,len(sortedBraces)):
                    currEdge = source['edges'][sortedBraces[index]]
                    diff = 1
                    prevEdge = source['edges'][sortedBraces[index-1]]
                    while prevEdge['trender'] == False:
                        diff += 1
                        prevEdge = source['edges'][sortedBraces[index-diff]]
                        
                    if currEdge['candleIndex'] - prevEdge['candleIndex'] > 2:
                        currEdge['trender'] = True
                    
            #TODO: what if a candle is both a peak and a valley??? RESEARCH AND HANDLE
        