// basic verifications.
if ( !IsType(NSControl,'function'))
{
	console.log("NSControl is not loaded and is required. aborting.");
	throw 'missing pre-requisite.';
}

// General time data for ease of coding.
g_timeDict={'second':0,'minute':1,'hour':2,'day':3,'month':4,'year':5};
g_timeData = [
		{'name':'second','units':60,'index':0,'ms':1000,
				'zero':function(d){d.setMilliseconds(0);},'get':function(d){return d.getSeconds();},
				'is-new':function(d){return d.getSeconds()==0;} 				,'add-unit':function(d,n){d.setSeconds(d.getSeconds()+n);}	,
				'get-string':function(d){return d.getSeconds();}},
		{'name':'minute','units':60,'index':1,'ms':1000*60,
				'zero':function(d){d.setMilliseconds(0);d.setSeconds(0);},'get':function(d){return d.getMinutes();},
				'is-new':function(d){return d.getMinutes()==0;} 				,'add-unit':function(d,n){d.setMinutes(d.getMinutes()+n);},
				'get-string':function(d){return d.getMinutes();}},
		{'name':'hour','units':24,'index':2,'ms':1000*60*60,
				'zero':function(d){d.setMilliseconds(0);d.setSeconds(0);d.setMinutes(0);},'get':function(d){return d.getHours();},
				'is-new':function(d){return d.getHours()==0;} 					,'add-unit':function(d,n){d.setHours(d.getHours()+n);},
				'get-string':function(d){return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);}},		
		{'name':'day','units':30,'index':3,'ms':1000*60*60*24,
				'zero':function(d){d.setMilliseconds(0);d.setSeconds(0);d.setMinutes(0);d.setHours(0);},'get':function(d){return d.getDate();},
				'is-new':function(d){return (d.getDate()==1 && d.getMonth==1);} ,'add-unit':function(d,n){return d.setDate(d.getDate()+n);},
				'get-string':function(d){return d.getDate()+"/"+(d.getMonth()+1);}},				
		{'name':'month','units':12,'index':4,'ms':1000*60*60*24*30, // around 30 days per month. not exact!!! pay attention when using.
				'zero':function(d){d.setMilliseconds(0);d.setSeconds(0);d.setMinutes(0);d.setHours(0);d.setDate(1);},'get':function(d){return d.getMonth()+1;},
				'is-new':function(d){return d.getMonth()==0;} 					,'add-unit':function(d,n){d.setMonth(d.getMonth()+n);},
				'get-string':function(d){return d.toDateString().substring(5,7);}},
		{'name':'year','index':5}
];

// This is a generic control that is meant to display data on a timeline.
// the control allows displaying a specific portion off the timeline.
// 3 time ranges are relevant:
// - the full range of the time - derived from available data.
// - the viewport - currently visible data range.
// - the available range of the current view - time based data views usually require scrolling and zooming in and out. for this purpose the control calculates 
//   and displays data on more then the visible (viewport) range - so that scrolling can be performed without causing redraw of the element. 
function DataOnTimelineControl(fromdate,todate,fromview,toview)
{
	// call parent constructor.
	this.constructor.call(this);

	// init views array and ranges.
	this.views =[];
	this.ranges = {};
	this.autoScroll = false; // auto scroll by default when view is attached to the right.
	
	// redraw always required on startup.
	this.redrawRequired = true;
	
	// default last date is right now. 
	this.eDate =   VerifyValue(new Date(), todate);	
	// default start date is a month back
	this.sDate = VerifyValue(new Date(this.eDate.getTime()-1000*60*60*24*30), fromdate);
	// default viewport start is the from date
	this.sVisible = VerifyValue(new Date(this.sDate), fromview);
	// default viewport end is the to date
	this.eVisible = VerifyValue(new Date(this.eDate), toview);
	
	// generate range availability 
	this.CalcAvailableRange();	
}

// inheriting object..
DataOnTimelineControl.inherits(NSObject);

// several function to reset the core dates of the control (view and date range) - all simply call an init method similar to the constructor.
DataOnTimelineControl.method("ResetView", function(fromview,toview)	{
	if ( typeof toview === 'undefined' )
		toview = new Date(this.eVisible.getTime() + fromview.getTime()-this.sVisible.getTime());
	this.InitDates(null,null,fromview,toview);
});
DataOnTimelineControl.method("ResetRange", function(fromdate,todate)	{
	this.InitDates(fromdate,todate);
});
DataOnTimelineControl.method("ResetRangeEnd", function(todate)	{
	this.InitDates(null,todate);
});

// if any of our primary dates changes - set them using this function.
DataOnTimelineControl.method("InitDates", function(fromdate,todate,fromview,toview)	{
	// test for autoscroll.
	if ( this.autoScroll && g_dontMoveStatGraph != true && typeof(todate) != 'undefined' && todate != null )			
	{
		toview = new Date(this.eDate.getTime());		
		fromview = new Date(this.eDate.getTime() - this.ranges['vRange']);		
	}
	this.redrawRequired = true;
	// default last date is right now. 
	this.eDate =   VerifyValue(this.eDate, todate);	
	// default start date is a month back
	this.sDate = VerifyValue(this.sDate, fromdate);
	// default viewport start is the from date
	this.sVisible = VerifyValue(this.sVisible, fromview);
	// default viewport end is the to date
	this.eVisible = VerifyValue(this.eVisible, toview);
	
	
	// generate range availability 
	if ( this.sVisible.getTime() < this.sAvailable.getTime() || this.eVisible.getTime() > this.eAvailable.getTime() )
		this.CalcAvailableRange();
	else if ( this.redrawRequired )
		this.LoadRangesInMilliseconds();			
});

// available range is the range that can be scrolled to without rebuilding the control.
// this is limited due to possible big ratio between viewport and preset range. i.e if viewing 2 minutes in a control that spans 2 years - the pixel
// size of the full range will be to large. 
// the current definition is that the available range should support scrolling x whole 'viewports' to each side. x is decided by rangeMult (hardcoded inside).  
DataOnTimelineControl.method("CalcAvailableRange", function()	{
	
	// maintain at least [rangemult] times the range on each side of the viewport without having to rebuild / redraw the control.
	var rangeMult = 6;
	
	// get milli seconds of all 
	var eView = this.eVisible.getTime(); 
	var sView = this.sVisible.getTime();
	var eTime = this.eDate.getTime();
	var sTime = this.sDate.getTime();
	
	// while we're at it - verify that viewport is not peeking out the boundaries of our data range.
	if ( sView < sTime )
	{
		sView = sTime;
		this.sVisible.setTime(sView);
	}
	if ( eView > eTime )
	{
		eView = eTime;
		this.eVisible.setTime(eView);
	}
	
	// what is the range of our viewport? available data in control div will be decided according to that measure..
	rangeView = eView-sView;
	
	// set wanted available edges according the defined range multiplication.
	var sAvailable = sView - rangeView*rangeMult;
	var eAvailable = eView + rangeView*rangeMult;
	
	// verify edges in boundaries
	if ( sAvailable < sTime )
		sAvailable = sTime;
	
	// verify edges in boundaries
	//if ( eAvailable > eTime)
		//eAvailable = eTime;	
	
	// set members.
	this.sAvailable = new Date(sAvailable);
	this.eAvailable = new Date(eAvailable);
	
	// load ranges to milli struct.
	this.LoadRangesInMilliseconds();
});

// When changing the display resolution, a single point on the timeline should remain visibly in place.
// this point is defined to be in the visible area of the timeline - input parameter is the position in the view from left to right (percentage 0 - leftmost. 100 - rightmost)
DataOnTimelineControl.method("SetAnchorPercent", function(pos)	{
	if ( pos < 0 )
		pos = 0;
	if ( pos > 100 )
		pos = 100;
	
	this.anchorPosPercent = pos;
});

// each control can have one or more views it affects. this is how we register a view:
// divName - the id of the div that will contain visible data.
// controlName - the div element must exist and contain a control that supports methods for drawing and sliding data.
DataOnTimelineControl.method("RegisterView", function(divName,controlName)	{
	if ( this.JQ(divName,true) )
	{
		// add to view array
		this.views.push({'id':divName,'control':controlName});
		// prepare transition css
		this.JQ(divName).css({'-webkit-transition':'width 0.2s','transition':'width 0.2s'});
		
		//TODO: prepare views if not the same as the first.
	}
	return this;
});

// scroll all views according to requested amount. 
DataOnTimelineControl.method("Scroll", function(speed)	{
	// set distance according to width of visible range.
	var seconds = (speed*this.ranges['vRange']/200)/1000;
	this.ScrollBySecond(seconds);	
});

DataOnTimelineControl.method("ScrollBySecond", function(seconds)	{
	var millis = seconds*1000;
	
	if ( this.ranges['sVisible'] + millis < this.ranges['sAvailable'] )
		millis = this.ranges['sAvailable'] - this.ranges['sVisible'];
	if ( this.ranges['eVisible'] + millis > this.ranges['eAvailable'] )
		millis = this.ranges['eAvailable'] - this.ranges['eVisible'];
	
	this.ranges['sVisible'] = this.ranges['sVisible'] += millis;
	this.ranges['eVisible'] = this.ranges['eVisible'] += millis;
	
	// update date members.
	this.sVisible.setTime(this.ranges['sVisible']);
	this.eVisible.setTime(this.ranges['eVisible']);
	
	// test if need to reset view if closing in to one of the corners.
	if ( !this.TestForRedraw() )
		this.NotifyViews('DrawAreaChanged',this.sVisible,this.eVisible);

});

// when scrolling, viewport area changes - update the date and range members and notify views. 
DataOnTimelineControl.method("UpdateViewportByScroll", function()	{
	// verify views are registered...
	if ( this.views.length == 0 )
		return;
	
	// get reference to a control.
	var c = this.JQ(this.views[0]['id'])[0][this.views[0]['control']];
	// get position of scroll in width. viewport and available are in same scale pos is actually the start of viewport.
	var pos = PosInRange(0,this.JQ(c.canvas,true).width(),this.JQ(this.views[0]['id']).scrollLeft()); 
	
	// update start of viewport milli. vRange is kept as is and then used to re-set the eVisible value. 
	this.ranges['sVisible'] = ValueInRange(this.ranges['sAvailable'],this.ranges['eAvailable'],pos);
	this.ranges['eVisible'] = this.ranges['sVisible']+this.ranges['vRange'];
	
	// update date members.
	this.sVisible.setTime(this.ranges['sVisible']);
	this.eVisible.setTime(this.ranges['eVisible']);
	
	// notify views.
	this.NotifyViews('DrawAreaChanged',this.sVisible,this.eVisible);
});

// working with date ranges we usually use the getTime method to get the milliseconds and perform calculations on them.
// for ease of code - we load all the milliseconds prehand and use them instead of calling getTime() for every call.
DataOnTimelineControl.method("LoadRangesInMilliseconds", function()	{
	var currAvailable = this.ranges['aRange'];
	var currVisible = this.ranges['vRange'];
	
	this.ranges = {
			'sDate':this.sDate.getTime(),
			'eDate':this.eDate.getTime(),
			'sAvailable':this.sAvailable.getTime(),
			'eAvailable':this.eAvailable.getTime(),
			'sVisible':this.sVisible.getTime(),
			'eVisible':this.eVisible.getTime()
	};
	this.ranges['dRange'] = this.ranges['eDate'] - this.ranges['sDate'];
	this.ranges['aRange'] = this.ranges['eAvailable'] - this.ranges['sAvailable'];
	this.ranges['vRange'] = this.ranges['eVisible'] - this.ranges['sVisible'];
	
	// if range has changed or a redraw is marked, refresh the canvas.
	if ( currVisible != this.ranges['vRange'] || currAvailable != this.ranges['aRange'] )
	{
		if ( (this.ranges['aRange']/this.ranges['vRange']) > 25 )
			this.CalcAvailableRange();
		
		this.NotifyViews('RefreshCanvas');
		this.redrawRequired = false;
	}
	else if ( this.redrawRequired )
	{
		this.NotifyViews('DrawAreaChanged',this.sVisible,this.eVisible);
		this.redrawRequired = false;
	}
});
// in case we worked with the milliseconds represenation of dates and changed them - easy method to reload all dates from the milliseconds representation.
DataOnTimelineControl.method("LoadDatesFromRanges", function()	{
	this.sDate.setTime(this.ranges['sDate']);
	this.eDate.setTime(this.ranges['eDate']);
	this.sAvailable.setTime(this.ranges['sAvailable']);
	this.eAvailable.setTime(this.ranges['eAvailable']);
	this.sVisible.setTime(this.ranges['sVisible']);
	this.eVisible.setTime(this.ranges['eVisible']);
});
// test if current state should issue a redraw of the system.
DataOnTimelineControl.method("TestForRedraw", function()	{
	if ( this.redrawRequired || 
		((this.ranges['eVisible'] + 10000 >= this.ranges['eAvailable'] ) && this.ranges['eAvailable'] < this.ranges['eDate']) ||
		((this.ranges['sVisible'] - 10000 <= this.ranges['sAvailable'] ) && this.ranges['sAvailable'] > this.ranges['sDate']) )
	{
		this.redrawRequired = true;
		this.CalcAvailableRange();
		return true;
	}
	return false;
});
// generic method to notify views - i.e. call a method in the view control that should be implemented there.
DataOnTimelineControl.method("NotifyViews", function(viewMethod)	{
	// get arguments into 
	var args = Array.prototype.slice.call(arguments).splice(1);
	// iterate on views and notify.
	for ( var index in this.views )
	{
		// get reference to control 
		var c = this.JQ(this.views[index]['id'])[0][this.views[index]['control']];
		
		// verify the control has implemented the required function.
		if ( IsType(c[viewMethod],'function') )			
			c[viewMethod].apply(c,args);
	}
});

DataOnTimelineControl.method("GetAVRatio", function()	{
	return this.ranges['aRange']/this.ranges['vRange'];
});

DataOnTimelineControl.method("GetTimePosition", function(time)	{
	return PosInRange(this.ranges['sAvailable'], this.ranges['eAvailable'], time.getTime());
});
DataOnTimelineControl.method("GetTimePositionVisible", function(time)	{
	return PosInRange(this.ranges['sVisible'], this.ranges['eVisible'], time.getTime());
});
DataOnTimelineControl.method("GetTimeFromPosition", function(pos)	{
	return Math.floor(ValueInRange(this.ranges['sAvailable'], this.ranges['eAvailable'], pos));
});
DataOnTimelineControl.method("GetTimeFromPositionVisible", function(pos)	{
	return Math.floor(ValueInRange(this.ranges['sVisible'], this.ranges['eVisible'], pos));;
});
DataOnTimelineControl.method("GetCurrentPosition", function()	{
	return this.GetTimePosition(this.sVisible);
});
DataOnTimelineControl.method("GetViewportSpan", function(unit)	{
	return (this.ranges['eVisible'] - this.ranges['sVisible'])/g_timeData[g_timeDict[unit]]['ms'];
});
// notify all views to draw all available points.
DataOnTimelineControl.method("RequestDraw", function(viewControl)	{
	viewControl.DrawAreaChanged(this.sAvailable,this.eAvailable);
});
DataOnTimelineControl.method("ZeroViews", function()	{
	this.views.length = 0;
});

// generic time controlled view control. this control attaches to a data on timeline controller. 
function TimeControlledView(name,init)
{
	// init constructor.
	NSControl.call(this,name);
		
	// verify init is an array.
	init = VerifyValue({}, init);
	
	// initialize the timeline control that the view will be based on.
	if ( 'attach' in init )
		this.timecontrol = init['attach'].RegisterView(this.divName,this.classname);
	else
	{
		// time control not given. initialize it.
		this.timecontrol = new DataOnTimelineControl(init['fromdate'],init['todate'],init['fromview'],init['toview']);
		// register ourselves.
		this.timecontrol.RegisterView(this.divName,this.classname);
	}
	
	// current painted areas: none.
	this.sPainted = new Date().getTime(); 	// start from now - all dates are currently earlier than now.
	this.ePainted = 0;						// end at epoc - all dates are later than epoc...

	// create the drawing context.
	this.InitView();
}
TimeControlledView.inherits(NSControl);

// when the available draw area is changed - time control calls this function.
TimeControlledView.method("DrawAreaChanged", function()	{
	throw 'Not implemented - parent must implement this function!';
});
// when the viewport size is changed - different views behave differently. 
// this should be implemented per view. 
TimeControlledView.method("ViewportSizeChanged", function()	{
	throw 'Not implemented - parent must implement this function!';
});

TimeControlledView.method("InitView", function()	{
	throw 'Not implemented - parent must implement this function!';
});

