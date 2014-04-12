
// this control contains a candle bar control (which draws candels by data set) - and controls the navigation on the data displayed
// by the candle bar control-  i.e. change the time frame displayed in the viewport.

function CandleBarController(name,init,data)
{
	// init constructor.
	NSControl.call(this,name);

	this.data = data;

	this.Init(init,data);
}
CandleBarController.inherits(NSControl);

CandleBarController.method("Init", function(init,data)	{
	// origin div will be divided into 2 sections:
	// candle graph section and time-control section.
	// first off - attach class to our div.
	this.JQ(this.divName).addClass("CBController");

	// get controller width and height.
	this.width = this.JQ(this.divName).width();
	this.height = this.JQ(this.divName).height();

	// controller is built out of the timeline control interface and the candle bar control.
	this.JQ(this.divName).html('<div id="'+this.divName+'-candle-bar" class="CBC-bar"></div>'+
								'<div id="'+this.divName+'-controls" class="CBC-controls"></div>');

	// initialize candle bar control.
	this.CandleBar = new CandleBar(this.divName+'-candle-bar',data,60,0);

	this.fullLeft = this.divName+"-fullLeft";
	this.halfLeft = this.divName+"-halfLeft";
	this.oneLeft = this.divName+"-oneLeft";
	this.fullRight = this.divName+"-fullRight";
	this.halfRight = this.divName+"-halfRight";
	this.oneRight = this.divName+"-oneRight";

	this.JQ(this.divName+'-controls').addClass("CBC-main");

	this.JQ(this.divName+'-controls').html('<div id="'+this.fullLeft+'" class="CBC-nav-button '+this.divName+'-CBC-nav-button">&#171;&#171;&#171;</div>'+
								'<div id="'+this.halfLeft+'" class="CBC-nav-button '+this.divName+'-CBC-nav-button">&#171;&#171;</div>'+
								'<div id="'+this.oneLeft+'" class="CBC-nav-button '+this.divName+'-CBC-nav-button">&#171;</div>'+
								'<div id="'+this.oneRight+'" class="CBC-nav-button '+this.divName+'-CBC-nav-button">&#187;</div>'+
								'<div id="'+this.halfRight+'" class="CBC-nav-button '+this.divName+'-CBC-nav-button">&#187;&#187;</div>'+
								'<div id="'+this.fullRight+'" class="CBC-nav-button '+this.divName+'-CBC-nav-button">&#187;&#187;&#187;</div>');

	// save this
	var CBController = this;
	this.JQ(this.oneLeft).on("click",function(){
		// change position in view
		if ( -CBController.CandleBar.endOffset < CBController.CandleBar.candleCount - CBController.CandleBar.viewportNumCandles )
			CBController.CandleBar.endOffset -= 1;

		CBController.CandleBar.VerifyViewportContent();
	});

	this.JQ(this.oneRight).on("click",function(){
		// change position in view
		if ( CBController.CandleBar.endOffset < 0 )
			CBController.CandleBar.endOffset += 1;

		CBController.CandleBar.VerifyViewportContent();
	});

	this.JQ(this.halfRight).on("click",function(){
		// change position in view
		CBController.CandleBar.endOffset += Math.round(CBController.CandleBar.viewportNumCandles/2);
		CBController.CandleBar.endOffset = Math.min(CBController.CandleBar.endOffset,0);

		CBController.CandleBar.VerifyViewportContent();
	});

	this.JQ(this.halfLeft).on("click",function(){
		// change position in view
		CBController.CandleBar.endOffset -= Math.round(CBController.CandleBar.viewportNumCandles/2);

		CBController.CandleBar.endOffset = Math.max(CBController.CandleBar.endOffset,-CBController.CandleBar.candleCount+CBController.CandleBar.viewportNumCandles);

		CBController.CandleBar.VerifyViewportContent();
	});

});
