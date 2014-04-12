// verify jquery is loaded
if (typeof jQuery == 'undefined') {  
    console.log('jquery is not loaded! aborting slider.');
    throw "jquery not loaded!";
} 

// extend jquery with the 'exists' method to test if a selector exists.
$.fn.exists = function () {
    return this.length !== 0;
};
$.fn.hasAttr = function(attr) 
{ 
	var attribVal = this.attr(attr); 
	return (attribVal !== undefined) && (attribVal !== false); 
};

function NSObject()
{	
	// member vars
	this.selectorTable = {};
}

//add a method to get the selector for a specific div. save selectors in a specific 
NSObject.method("JQ", function(divname,force)	{
	
	// if selector doesn't exist yet get it from dom.
	if (this.selectorTable[divname] == null || force===true)
	{
		this.selectorTable[divname] = $("#"+divname);
	
		if ( !this.selectorTable[divname].exists() )
		{
			console.log(this.classname + " possible error. div "+divname+" does not exist.");
			return null;			
		}
	}
	
	return this.selectorTable[divname];	
});


// This is a generic control class. to parent more specific controls.
// controls of this type draw themselves in a div received on initialization.
// name - the name of div to host the control.
function NSControl(name)
{
	// init parent
	NSObject.call(this);
	
	// register control in DOM - on parent div.
	if ( !IsType(this.classname,'string') )
		this.classname = this.constructor.name;
	
	// mandatory var - name is the name of the div the conrol will fit in.
	this.divName = name;
	
	// verify name is valid
	if ( !IsType(name,'string') )
	{
		console.log('error - control must recieve a div name to create itself inside it');
		return null;
	}
	
	// if div name doesn't exist abort.	
	if ( this.JQ(name) == null )
	{
		console.log('error - div ' + name + ' does not exist.');
		return null;
	}
	
	// test that div has a defined width and height.
	if ( !this.JQ(name).width() || !this.JQ(name).height() )
	{
		console.log(this.classname+" generation error. div "+name+" has no size.");
		throw "missing css values for div "+name;
	}
	
	this.JQ(this.divName)[0][this.classname] = this;
	
	return this;
}

// every control is also an object..
NSControl.inherits(NSObject);
