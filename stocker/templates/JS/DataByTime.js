// Data by time is an object that saves any type of data according to time stamps.
// it handles adding, sorting the data array according to timestamps, and retrieving values by range / time. 
function DataByTime(interval,averageZeros)
{
	this.data = [];
	this.dataDict = {};
	this.maxValue = 0;
	this.intervalMS = VerifyValue(1000,interval);
	this.averageZeros = VerifyValue(true,averageZeros);
}
DataByTime.method("AddElement", function(time,data)	{	
	
	if ( time in this.dataDict )
		return;
	
	// adjust to interval
	var integralTime = new Date(time.getTime()- time.getTime()%this.intervalMS);
	
	// by default new element is simply the data received.
	var elem = {"time":integralTime,"data":data};
	
	// if this is the same time - calculate average
	this.data.push(elem);	
		
	this.dataDict[time] = data;
	this.data.sort(this.Compare);
});
DataByTime.method("Compare", function(a,b)	{
	if (a.time < b.time)
		return -1;
	if (a.time > b.time)
		return 1;
	return 0;
});
DataByTime.method("GetRange", function(startRange,endRange,pad)	{
	var range = [];
	var index = 0;
	// if pad is not defined place 0.
	pad = VerifyValue(0, pad);
	
	// get to first relevant element.
	while ( index < this.data.length && startRange.getTime() >= this.data[index].time )
		index++;
	
	var sIndex = index-pad;
	// find relevant elements and add to return array.
	while ( index < this.data.length && endRange.getTime() >= this.data[index].time )
		index++;
	var eIndex = index;
	
	// verify index limits. 
	if ( sIndex < 0 ) sIndex = 0;
	if ( eIndex > this.data.length-1 ) eIndex = this.data.length-1;		
	
	// all points to 
	for ( index = sIndex ; index <= eIndex ; index++ )
		//add element to range
		range.push(this.data[index]);
	
	return range;
});
DataByTime.method("Start", function()	{
	return this.data[0]['time'];
});
DataByTime.method("End", function()	{
	return this.data[this.data.length-1]['time'];
});
DataByTime.method("GetNearestAvailableData", function(time)	{
	for ( var index = 0 ; index < this.data.length ; index++ )
	{
		if ( this.data[index]['time'] > time || index == this.data.length-1 )
			return this.data[index];
		
		// if next element is later then our received time, check which is closer to the point we're on. 
		if ( this.data[index+1]['time'] > time )
		{
			if ( time - this.data[index]['time'] <= this.data[index+1]['time']-time )
				return this.data[index];
			else
				return this.data[index+1];
		}
	}
	return null;
});
DataByTime.method("GetRangeByIndex",function(index,count)
{
	var range = [];
	for ( var dIndex = index ; index < dIndex+count && dIndex < this.data.length ; dIndex++ )
		range.push(this.data[dIndex]);

	return range;	
});
