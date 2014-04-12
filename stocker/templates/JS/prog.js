var symbol = null;
function loadSymbol()
{
    symbol = $("#symbol").val();
    
    // Assign handlers immediately after making the request,
    // and remember the jqXHR object for this request
    var jqxhr = $.ajax( "https://stocker-c9-noam_shabat.c9.io/stock/"+symbol+"/weekly/data/" )
    .done(function(data,statusText,response) {
        var now = new Date();
        var start = new Date(now.getTime()-1000*60*60*24*365);  // one year back
        var vs = new Date(now.getTime()-1000*60*60*24*90);	// 3 months back
        var ve = new Date(now.getTime()-1000*60*60*24*30);	// one month back
        var stam = new CandleBarController("candles",{'fromdate':start,'todate':now,'fromview':vs,'toview':ve},data);
    })
    .fail(function() {
        alert( "error" );
    })
}

function markEdges()
{
    // Assign handlers immediately after making the request,
    // and remember the jqXHR object for this request
    var jqxhr = $.ajax( "https://stocker-c9-noam_shabat.c9.io/stock/"+symbol+"/weekly/edges/" )
    .done(function(data,statusText,response) {
        for ( var edge in data )
        {
            var edgeDate = new Date(edge);
            var test = $("#"+edgeDate.getTime());
            var color="orange";
            if ( data[edge]["type"] !== "peak")
                color = "black";
            test.css({"stroke":color,"stroke-width":0.4});
        }
    })
    .fail(function() {
        alert( "error" );
    })
}
$("#progress").html("Getting stock data");




