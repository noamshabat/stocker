// Extending string object with trim if required.
if (!String.prototype.trim) {
	String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};

	String.prototype.ltrim=function(){return this.replace(/^\s+/,'');};

	String.prototype.rtrim=function(){return this.replace(/\s+$/,'');};

	String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};
}

//object.watch
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop, handler) {
			var
			  oldval = this[prop]
			, newval = oldval
			, getter = function () {
				return newval;
			}
			, setter = function (val) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			}
			;
			
			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					  get: getter
					, set: setter
					, enumerable: true
					, configurable: true
				});
			}
		}
	});
}
 
// object.unwatch
if (!Object.prototype.unwatch) {
	Object.defineProperty(Object.prototype, "unwatch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop) {
			var val = this[prop];
			delete this[prop]; // remove accessors
			this[prop] = val;
		}
	});
}

// Extend function prototype with the 'method' method for easier classing.  
Function.prototype.method = function (name, func) {
    this.prototype[name] = func;
    return this;
};
var g_global = this;
// Extend Function prototype - Support inheritence using the 'inherits' method below.
Function.method('inherits', function (parent) {
	function F(){};
	F.prototype = parent.prototype;
    this.prototype = new F();
    var d = {}, 
        p = this.prototype;
    
    // search through the global object for a name that resolves to this object
    for (var name in g_global) 
    	if (g_global[name] == this) 
    		this.prototype.classname = name;
      
    this.prototype.constructor = parent;    
    this.method('uber', function uber(name) {
        if (!(name in d)) {
            d[name] = 0;
        }        
        var f, r, t = d[name], v = parent.prototype;
        if (t) {
            while (t) {
                v = v.constructor.prototype;
                t -= 1;
            }
            f = v[name];
        } else {
            f = p[name];
            if (f == this[name]) {
                f = v[name];
            }
        }
        d[name] += 1;
        r = f.apply(this, Array.prototype.slice.apply(arguments, [1]));
        d[name] -= 1;
        return r;
    });
    return this;
});

// Extend function for inheritance - allow inheriting only specific functions and methods from the parent.
Function.method('swiss', function (parent) {
    for (var i = 1; i < arguments.length; i += 1) {
        var name = arguments[i];
        this.prototype[name] = parent.prototype[name];
    }
    return this;
});

// testing variable type
function IsType(arg,type)
{
	var typeCheck = typeof arg;
	if ( typeCheck === type )
		return true;
	else
		return false;
}

// this function test to verify that the arg argument is valid. if not - returns the default value.
function VerifyValue(defaultValue,arg)
{
	if ( arg != null && (typeof arg) == (typeof defaultValue) )
		return arg;
	else
		return defaultValue;
}

function PosInRange(min,max,point)
{
	return (point-min)/(max-min);
}
function ValueInRange(min,max,pos)
{
	return min + (max-min)*pos;
}
function SinusValueInRangeFromPos(pos)
{
	return Math.sin(pos*Math.PI/2);
}
function LimitValueInRange(min,max,val)
{
	if ( val < min )
		return min;
	else if ( val > max )
		return max;
	else
		return val;
}

function loadjscssfile(filename, filetype){
	if (filetype=="js")
	{ 	
		//if filename is a external JavaScript file
		var fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", filename);
	}
	else if (filetype=="css"){ //if filename is an external CSS file
		var fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", filename);
	}
	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
}
// get an input size in MB, and return a string with either KB, MB, GB, TB
function GetSizeStringByUnit(input)
{
	if ( input < 1 )
		return Math.floor(input*1024)+"KB";
	if ( input < 1024 )
		return Math.floor(input)+"MB";
	if ( input < 1024*1024 )
		return Math.floor(input/1024)+"GB";
	
	return Math.floor(input/(1024*1024))+"TB";
}

function AddDragBlocker()
{
	$("body").append("<div id=\"dragblocker\" class=\"noselect\" style=\"width:100%;height:100%;background:transparent;z-index:30;position:absolute;top:0px;left:0px;\"></div>");
}

function TimeTranslate(val,inunit,outunit,fpointMax)
{
	VerifyValue(0, fpointMax);
	
	unit_map = {
		'min':1,
		'sec':60,
		'ms':60000,
		'mc':60000000	
	};
	
	return fPointCut(val/unit_map[inunit]*unit_map[outunit],fpointMax);
}

function fPointCut(val,fpointMax)
{
	return Math.round(val*Math.pow(10,fpointMax))/Math.pow(10, fpointMax);
}

function DigitLimitConditional(val,numDigits)
{
	// the floating point (modulus like) number
	var fNum = val - Math.floor(val);
	// number of digits after the point.
	var fDigits = fNum.toString().length > 1 ? fNum.toString().length-2 : 0;
	// number of natural number digits.
	var nDigits = Math.floor(val).toString().length;
	// if we did not pass numDigits in the natural number - we can cut some of the floating digits and leave some.
	var fDigitsMax = numDigits - nDigits;
	// do we have space for floating point digits?
	if ( fDigitsMax <= 0 )
		return Math.round(val);
	else // we have some floating point space = cut and return proper number.
		return fPointCut(val,fDigitsMax);
}

function isFunction(functionToCheck) {
	 var getType = {};
	 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function maxWindow() {
	
	var pfx = ["webkit", "moz", "ms", "o", ""];
	function RunPrefixMethod(obj, method) {	
		var p = 0, m, t;
		while (p < pfx.length && !obj[m]) {
			m = method;
			if (pfx[p] == "") {
				m = m.substr(0,1).toLowerCase() + m.substr(1);
			}
			m = pfx[p] + m;
			t = typeof obj[m];
			if (t != "undefined") {
				pfx = [pfx[p]];
				return (t == "function" ? obj[m]() : obj[m]);
			}
			p++;
		}
	}
	if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) {
		RunPrefixMethod(document, "CancelFullScreen");
	}
	else {
		RunPrefixMethod($(".padder")[0], "RequestFullScreen");
	}
	
}