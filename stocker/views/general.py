from django.http import HttpResponse
import simplejson as json
from django.shortcuts import render_to_response
from stocker.getters.yahoo import YahooGetter
from stocker.stock import Stock
import decimal
        
# define getter class
yahooGetter = YahooGetter(None)
    
def html(request,data):
    return render_to_response(data+'.html', {'name': 'noam'})

def js(request,data):
    response = render_to_response(data)
    response['Content-Type'] = 'application/javascript';
    return response

def css(request,data):
    return render_to_response(data)
    
def main(request):
    return render_to_response('main.html')
    
def stock(request,symbol,res,info):
    
    # get stock data for Yahoo
    stockData = yahooGetter.GetStockData(symbol.upper())
    
    # define stock class for Yahoo.
    theStock = Stock(symbol.upper())
    
    # add data to yahoo stock
    theStock.PutDailyData(stockData)
    
    return HttpResponse(json.dumps(theStock.__dict__[res][info],use_decimal=True), content_type='application/json')
