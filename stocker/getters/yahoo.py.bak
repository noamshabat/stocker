from datetime import datetime,timedelta
from decimal import *
from logger.logger import Log
import urllib2
import json
import urllib

class YahooGetter:
    
    def __init__(self,callback):
        # store basic query and callback
        self.baseUrl = "http://query.yahooapis.com/v1/public/yql?"
        self.baseQuery = "q=select * from yahoo.finance.historicaldata where symbol = \"%s\" and startDate = \"%s\" and endDate = \"%s\"&format=json&env=store://datatables.org/alltableswithkeys&callback="
        self.callback = callback
    
    def GetStockData(self,symbol): 
        
        Log('Collecting data for symbol "'+symbol+'"')
        
        # set end date to right now
        self.symbol = symbol
        self.endDate = datetime.now()
        
        # init data member
        self.stockData = {}
        self.stockData[symbol] = {}
        
        #start collecting
        self.symbol = symbol
        return self.Collect()
        
    def ParseResult(self,data):
        # if no data there's no point going on...
        if data['query']['count'] == 0:
            return False
        
        # go over all returned elements and create a date based dictionary.
        for item in data['query']['results']['quote']:
            # re-package by date
            self.stockData[self.symbol][item['Date']] = {
                    'open':Decimal(item['Open']),
                    'close':Decimal(item['Close']),
                    'high':Decimal(item['High']),
                    'low':Decimal(item['Low']),
                    'volume':int(item['Volume'])
                }
        
        return False
        return True
    def Collect(self):
        # set current start date
        self.currStart = self.endDate - timedelta(days=365)
        self.currEnd = self.endDate
        
        # loop over more times.
        getMore = True
        while getMore:
            # get current stock data by dates from source (yahoo)
            currData = self.GetStockDataByDate(self.currStart,self.currEnd)
            
            # change to and from vars for next loop 
            self.currEnd = self.currStart - timedelta(days=1)
            self.currStart = self.currStart - timedelta(days=365)
            
            # parse current data
            getMore = self.ParseResult(currData)
        
        return self.stockData[self.symbol]
               
        
    def GetStockDataByDate(self,dFrom,dTo):
        # parse dates to more conveninet strings
        fromStr = dFrom.strftime("%Y-%m-%d")
        toStr = dTo.strftime("%Y-%m-%d")
        
        #log entry
        Log("Collect '%s' dates %s to %s"%(self.symbol,fromStr,toStr))
        
        # url of yahoo finance api - inject symbol and requested dates.
        req = self.baseQuery%(self.symbol,fromStr,toStr)
        # url encode relevant parts.
        req = self.baseUrl+urllib.quote(req,"=&*")
        
        # send REST request to yahoo. get string repsonse.
        strData = urllib2.urlopen(req).read()
        
        # create json dict from string and return it.
        return json.loads(strData)
    