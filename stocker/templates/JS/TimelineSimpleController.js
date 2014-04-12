// given a specific data on timeline control, this class supports moving on the timeline.
function TimelineSimpleController(name,init)
{
	NSControl.call(this,name);

	// do we already have a time control view? or do we need to create it?
	if ( 'attach' in init )
		this.timecontrol = init['attach'];
	else
		// time control not given. initialize it.
		this.timecontrol = new DataOnTimelineControl(init['fromdate'],init['todate'],init['fromview'],init['toview']);

	this.Init();
}

TimelineSimpleController.inherits(NSControl);

// initialize controller controls.
TimelineSimpleController.prototype.Init = function()
{
	this.fullLeft = this.divName+"-fullLeft";
	this.halfLeft = this.divName+"-halfLeft";
	this.oneLeft = this.divName+"-oneLeft";
	this.fullRight = this.divName+"-fullRight";
	this.halfRight = this.divName+"-halfRight";
	this.oneRight = this.divName+"-oneRight";

	this.JQ(this.divName).addClass("TLSC-main");

	this.JQ(this.divName).html('<div id="'+this.fullLeft+'" class="TLSC-nav-button '+this.divName+'-TLSC-nav-button">&#171;&#171;&#171;</div>'+
								'<div id="'+this.halfLeft+'" class="TLSC-nav-button '+this.divName+'-TLSC-nav-button">&#171;&#171;</div>'+
								'<div id="'+this.oneLeft+'" class="TLSC-nav-button '+this.divName+'-TLSC-nav-button">&#171;</div>'+
								'<div id="'+this.oneRight+'" class="TLSC-nav-button '+this.divName+'-TLSC-nav-button">&#187;</div>'+							
								'<div id="'+this.halfRight+'" class="TLSC-nav-button '+this.divName+'-TLSC-nav-button">&#187;&#187;</div>'+
								'<div id="'+this.fullRight+'" class="TLSC-nav-button '+this.divName+'-TLSC-nav-button">&#187;&#187;&#187;</div>');
							
	this.SetUnitSize(1000*60*60*24); // set initial unit size to 1 day.

	this.BindToController();
}

// bind all navigation buttons to controller
TimelineSimpleController.prototype.BindToController = function()
{
	var timecontroller = this;
	$("#"+this.oneLeft).on("click",function(){
		var prevFrom = timecontroller.timecontrol.sVisible;
		timecontroller.timecontrol.ResetView(new Date(prevFrom.getTime()-timecontroller.unitSize));
	});
}

TimelineSimpleController.prototype.SetUnitSize = function(unitSize)
{
	this.unitSize = unitSize;
}