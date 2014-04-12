from django.http import HttpResponse
import json
from django.shortcuts import render_to_response
from stocker.getters.yahoo import YahooGetter
from stocker.stock import Stock
import decimal

class DecimalEncoder(json.JSONEncoder):
    def _iterencode(self, o, markers=None):
        if isinstance(o, decimal.Decimal):
            # wanted a simple yield str(o) in the next line,
            # but that would mean a yield on the line with super(...),
            # which wouldn't work (see my comment below), so...
            return (str(o) for o in [o])
        return super(DecimalEncoder, self)._iterencode(o, markers)
        
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
    
    return HttpResponse(json.dumps(theStock.__dict__[res][info], cls=DecimalEncoder), content_type='application/json')
