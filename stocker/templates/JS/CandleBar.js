// basic view of a time slider.
function CandleBar(name,data,numCandles,endOffset)
{
    // set name for container elements.
    this.SVGName = name+'-SVG';
    this.SVGView = this.SVGName+'-view';

    // get constructor
    NSControl.call(this,name);

    // candles data to draw.
    this.InitializeData(data);

    // set number of candles to display in the viewport.
    this.viewportNumCandles = VerifyValue(30,numCandles);
    
    this.viewportNumCandles = Math.min(this.viewportNumCandles,this.candles['data'].length);

    this.endOffset = VerifyValue(0,endOffset);

    // create the drawing context.
    this.InitView();
}
CandleBar.inherits(NSControl);

CandleBar.method("InitializeData", function(input) {

    // while we're going over candles, find the minimum and maximum value for the graph.
    this.maxValue = 0;
    this.minValue = 100000000;
    this.maxVolume = 0;

    this.candles = new DataByTime(1000*60*60*24); // input is integral interval for normalization - 1 day in ms.

    // go over input items and insert them in to the data struct.
    for ( var item in input )
    {
        this.maxVolume = Math.max(this.maxVolume,input[item]['volume']);
        this.maxValue = Math.max(this.maxValue,input[item]['low'],input[item]['high'],input[item]['open'],input[item]['close']);
        this.candles.AddElement(new Date(item),input[item]);
    }
});

// initialize svg view.
CandleBar.method("InitView", function()    {
    // width and height are set at load and do not change with resize.
    this.width = this.JQ(this.divName).width();
    this.height = this.JQ(this.divName).height();

    // dimensions of internal group is set by the number of candles.
    this.candleCount = this.candles.data.length;

    // candle width and spacing width is a set value.
    // to change resolution we transform the view.
    // candle width is 9 pixels.
    this.candleWidth = 9;
    this.candleSpacing = 5;
    this.candleFullWidth = this.candleWidth+this.candleSpacing;

    // according to candle data - determine the width and height of the view.
    // extra spacing after last candle...
    this.canvasWidth = this.candleCount*this.candleFullWidth+this.candleSpacing;

    // load svg canvas.
    this.JQ(this.divName).html( '<svg id="'+this.SVGName+'" width="'+this.width+'" height="'+this.height+'">'+
                                    '<g id="'+this.SVGView+'" width="'+this.canvasWidth+'" height="'+this.height+'"></g>'+
                                '</svg>');

    // new canvas created - reset content state vars - from at end and to at start... (i.e. no data).
    this.sPainted = this.candleCount;       // start from last candle.
    this.ePainted = 0;                      // end at 0.. this means nothing is drawn.

    // get container elements for ease of access.
    this.SVG = this.JQ(this.SVGName,true);
    this.viewport = this.JQ(this.SVGView,true);

    // set one day resolution
    this.SetResolution(1000*60*60*24);

    // we have a new viewport. apply it.
    this.DrawAreaChanged(true);
});

CandleBar.prototype.SetResolution = function(resolution)
{
    this.resolution = resolution;

    // set scale X according to cuurent view.
    this.scaleX = this.width / (this.viewportNumCandles*this.candleFullWidth+this.candleSpacing);
};

// new viewport data is available. according to state - draw / stretch etc...
CandleBar.method("DrawAreaChanged", function() {


    this.VerifyViewportContent();

    /*if ( from < this.sPainted )
        this.sPainted = from;
    if ( to > this.ePainted )
        this.ePainted = to;*/

});

CandleBar.method("GetCandleData", function(date)   {
    return this.candles.GetNearestAvailableData(date);
});

CandleBar.method("VerifyViewportContent", function()   {

    // get relevant range.
    var rangeStart = this.candleCount+this.endOffset-this.viewportNumCandles;
    var rangeEnd = this.candleCount;
    var toDraw = this.candles.GetRangeByIndex(rangeStart,this.candleCount-rangeStart);

    var elemIndex = rangeStart;
    var rangeMax = 0;
    var rangeMin = 10000000;
    // draw each candle
    for ( var elem in toDraw )
    {
        // get candle data.
        var candle = toDraw[elem]['data'];

        rangeMax = Math.max(rangeMax,candle['low'],candle['high'],candle['open'],candle['close']);
        rangeMin = Math.min(rangeMin,candle['low'],candle['high'],candle['open'],candle['close']);

        // is green or red.
        var color = candle['open'] > candle['close'] ? 'red' : 'green';

        // get borders of candle.
        var lTop = Math.max(candle['high'],candle['low']);
        var lBottom = Math.min(candle['high'],candle['low']);
        var bTop = Math.max(candle['open'],candle['close']);
        var bBottom = Math.min(candle['open'],candle['close']);

        // find candle horizontal position.
        // get distance from viewport start, and calculate by spacing and candle width
        // dx is position of start of candle.
        var dxCandle = Math.round(elemIndex*(this.candleFullWidth)) + this.candleSpacing/2;
        var dxLine = dxCandle + Math.round(this.candleWidth/2);

        // draw line from top to bottom.
        var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        //newLine.setAttribute('id','line2');
        newLine.setAttribute('x1',dxLine);
        newLine.setAttribute('y1',lTop);
        newLine.setAttribute('x2',dxLine);
        newLine.setAttribute('y2',lBottom);
        newLine.setAttribute('style',"stroke:"+color+";stroke-width:1");
        this.viewport.append(newLine);

        // draw body from open to close.
        var newRect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        //newLine.setAttribute('id','line2');
        newRect.setAttribute('id',toDraw[elem]["time"].getTime());
        newRect.setAttribute('width',this.candleWidth);
        newRect.setAttribute('height',(bTop-bBottom));
        newRect.setAttribute('transform','translate('+dxCandle+','+bBottom+')');
        newRect.setAttribute('style',"fill:"+color+";stroke-width:0");
        $(newRect).hover(ShowCandleData,HideCandleData);
        this.viewport.append(newRect);

        elemIndex++;
    }

    // set viewbox to show candles
    var viewHeight = rangeMax-rangeMin;
    var viewLeft = -rangeStart*this.candleFullWidth;
    var viewTop = -rangeMin;
    var scaleY = -(this.height / viewHeight);
    this.viewport[0].setAttribute("transform","translate("+(viewLeft*this.scaleX)+","+(this.height+viewTop*scaleY)+") scale("+this.scaleX+" "+scaleY+")");
});

function ShowCandleData(event)
{
    var date = new Date(parseInt($(this).attr("id")));
    var cBar = $("#candles-candle-bar")[0].CandleBar;
    var candle = cBar.GetCandleData(date);

    $("#candle-data").html("<div>date - " + candle["time"]+"</div>"+
            "<div>open - " + candle["data"]["open"]+"</div>"+
            "<div>close - " + candle["data"]["close"]+"</div>"+
            "<div>high - " + candle["data"]["high"]+"</div>"+
            "<div>low - " + candle["data"]["low"]+"</div>"+
            "<div>trend - " + candle["data"]["candle-trend"]+"</div>");
}
function HideCandleData(event)
{
    $("#candle-data").html("");
}