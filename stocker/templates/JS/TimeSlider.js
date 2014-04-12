// CONSTANTS (psuedo) FOR TIME SLIDER
var PX_BETWEEN_NOTCHES = 5;


// basic view of a time slider.
function TimeSlider(name,init)
{
	// initialize child elements names	
	this.contentDiv = name+"-content";
	this.oldcontentDiv = name+"-content-old";
	this.viewportDiv = name+"-viewport";
	
	// init constructor.
	TimeControlledView.call(this,name,init);	
}
TimeSlider.inherits(TimeControlledView);

// initialize the control. 
TimeSlider.method("InitView", function()	{
	
	// create the viewport and content
	this.JQ(this.divName).html('<div id="'+this.viewportDiv+'" style="overflow:hidden;position:relative;" class="slider-viewport '+this.divName+'-slider-viewport" >'+
								  '<div id="'+this.contentDiv+'" style="position:absolute;" class="slider-content '+this.divName+'-slider-content"></div>'+
							   '</div>');
	
	// get viewport generated size.
	this.viewportWidth = this.JQ(this.viewportDiv).width();
	
	// we have a new viewport. apply it.
	this.ViewportSizeChanged(true);	
});

TimeSlider.method("ViewportSizeChanged", function(create)	{
	// calculate new target width of control container
	this.contentWidth = this.timecontrol.GetAVRatio()*this.JQ(this.divName).width();
	this.currLeft = -this.timecontrol.GetCurrentPosition()*this.JQ(this.contentDiv).width();
	
	// do we need to replace current content or create a new 
	if ( create )
	{
		// creating new content. removing all content data and resetting width.
		this.JQ(this.contentDiv).html("").css({"width":this.contentWidth,"left":this.currLeft});
		
		// new div created - reset content state vars - from at end and to at start... (i.e. no data).
		this.sPainted = new Date().getTime(); 	// start from now - all dates are currently earlier than now.
		this.ePainted = 0;						// end at epoc - all dates are later than epoc...
		
		// get current resolution
		this.IdentifyResolution();
		
		// put data in content content.
		this.ResetContentRange();
		
 
	}
});

TimeSlider.method("IdentifyResolution", function()	{
	
	// start with seconds resolution and stop when there's enough room for the data.
	for ( var intervalIndex = 0 ; intervalIndex < g_timeData.length ; intervalIndex++ )
	{
		// get span of viewport in units.
		var viewSpan = this.timecontrol.GetViewportSpan(g_timeData[intervalIndex]['name']);
		
		// if we have enough  pixels - set current resolution (we want as much data as possible.
		if ( (this.viewportWidth / viewSpan) > PX_BETWEEN_NOTCHES )
		{
			this.resolution = g_timeData[intervalIndex]['name'];
			break;
		}
	}
});

TimeSlider.method("ResetContentRange", function()	{
	// find intervals between notches that have indicators on them...
	this.SetNotchTextInterval();
	
	// fill viewport with notch data.
	this.VerifyViewportContent(this.timecontrol.sVisible.getTime(),this.timecontrol.eVisible.getTime());
});

//we need this to determine how often we want to add a number to a notch (too crowded will be unusable.)
TimeSlider.method("SetNotchTextInterval", function()	{
	// calculate difference in pixels between 2 notches:  
	// get number of units in viewport.
	var viewSpan = this.timecontrol.GetViewportSpan(this.resolution);
	// divide by viewport width
	var pxPerUnit = this.viewportWidth/viewSpan;
	
	// define the minimum difference between noches for text displaying:
	var minDiff = 50;
	this.notchTextInterval = 1;
	// test the notch intervals to display text - for minutes and days jump in intervals of 5.
	if ( pxPerUnit < minDiff)
	{
		// minutes and seconds come in intervals of 5 or 10 - we do not allow smaller intervals for them.
		// others have a constant interval.
		if ( g_timeDict[this.resolution] <= 1)
		{
			if ( pxPerUnit*5 > minDiff )
				this.notchTextInterval = 5;
			else
				this.notchTextInterval = 10;
		}
		else
			this.notchTextInterval = Math.floor(minDiff/pxPerUnit)+1;
	}
});

TimeSlider.method("VerifyViewportContent", function(from,to)	{
	// if requested data is already filled - return.
	if ( from >= this.sPainted && to <= this.ePainted )
		return;
	
	// fill only areas that aren't yet filled.
	if ( from < this.ePainted && from > this.sPainted )
		from = this.ePainted;
	if ( to < this.ePainted && to > this.sPainted )
		to = this.sPainted;
	
	// set work date var.
	var currentDate = new Date();
	currentDate.setTime(from);
	// make sure date is on integral border of our current unit.
	g_timeData[g_timeDict[this.resolution]]['zero'](currentDate);
	
	var iteration = 0;
	
	// filling out content. (notches and text..)
	while ( currentDate.getTime() < to )
	{		
		value = g_timeData[g_timeDict[this.resolution]]['get-string'](currentDate);
		value = '<div class="'+this.divName+'-slider-notch-text slider-notch-text">'+value+'</div>';
		
		// if we're at the end of a cycle.
		if ( g_timeData[g_timeDict[this.resolution]]['is-new'](currentDate) )
		{	
			if ( g_timeDict[this.resolution] < 2 )
				highVal = g_timeData[2]['get-string'](currentDate); // get hour and minute when a round minute or round hour reached.
			else if ( g_timeDict[this.resolution] < 3 )
				highVal = g_timeData[3]['get-string'](currentDate); // get month name when end of month.
			else
				highVal = currentDate.getFullYear();
			
			//TODO: maybe remove center is it is about to be obsolete..
			value = '<div>'+value+'</div><div class="'+this.divName+'-slider-highval slider-highval slider-notch-text">'+highVal+'</div>';
		}
		
		// basic border color for smaller notches (on intervals we have bigger lines with lighter colors).
		borderColor = "#323232";
		size = 12; // default notch size
		
		if ( (g_timeData[g_timeDict[this.resolution]]['get'](currentDate)%this.notchTextInterval != 0 && g_timeDict[this.resolution] <= 1) ||  // for minutes and seconds.
			 (iteration%this.interval && g_timeDict[this.resolution] > 1)	)
		{
			value = "";
			if ( this.notchTextInterval == 10 && g_timeData[g_timeDict[this.resolution]]['nget'](currentDate)%5 == 0 )
			{
				borderColor = "#656565";
				size *= 1.5;
			}
		}
		else if ( this.notchTextInterval > 1  )
		{
			borderColor = "#656565";
			size *= 1.2;
		}

		// get position of current date in content. 
		var offset = 100*this.timecontrol.GetTimePosition(currentDate)+"%";
		
		var notchString = '<div class="'+this.divName+'-slider-notch-'+this.resolution+' slider-notch slider-notch-'+this.resolution+'" style="left:'+offset+';"><div style="height:'+size+'px;border-left:1px solid '+borderColor+';"></div>'+value+'</div>';
		this.JQ(this.contentDiv).append(notchString);
		
		// add time to current drawing.
		g_timeData[g_timeDict[this.resolution]]['add-unit'](currentDate,1);
		g_timeData[g_timeDict[this.resolution]]['zero'](currentDate);
		
		iteration++;
	}
	
	if ( from < this.sPainted ) 
		this.sPainted = from;
	if ( to > this.ePainted )
		this.ePainted = to;

});