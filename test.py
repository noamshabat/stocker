#!/usr/bin/env python
import os
import sys
import httplib
from pprint import pprint
from stocker.getters.yahoo import YahooGetter
from stocker.stock import Stock

if __name__ == "__main__":
    #os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stocker.settings")

    #from django.core.management import execute_from_command_line

    #execute_from_command_line(sys.argv)
    
    # define getter class
    yahooGetter = YahooGetter(None)
    # get stock data for Yahoo
    yahooData = yahooGetter.GetStockData("YHOO")
    
    # define stock class for Yahoo.
    yahooS = Stock("YHOO")
    
    # add data to yahoo stock
    yahooS.PutDailyData(yahooData)
    pprint(yahooS.weekly['valleys'])
    