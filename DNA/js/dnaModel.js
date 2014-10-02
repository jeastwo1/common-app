/* JavaScript Document
TODO: Mouse control: Drag Scroll Vertical
*/

//Define Icons
var IconFolder = "images/", IconLinks = [], IconType = ".png";
var Debug = false;

//addIcon syntax: Image Name, Callback Function
addIcon('Dashboard',	function(){ tizen.application.launch("intelPoc12.Dashboard");			});
addIcon('Fingerprint',	function(){ tizen.application.launch("intelPoc32.FingerPrint");			});
addIcon('HVAC',			function(){ tizen.application.launch("intelPoc16.HVAC");				});
addIcon('Media',		function(){ tizen.application.launch("intelPoc14.MultimediaPlayer");	});
addIcon('Navigation',	function(){ tizen.application.launch("intelPoc11.navigation");			});
addIcon('News',			function(){ tizen.application.launch("intelPoc30.News");				});
addIcon('Phone',		function(){ tizen.application.launch("intelPoc15.phone");				});
addIcon('Weather',		function(){ tizen.application.launch("intelPoc31.Weather");				});

//Definitions
var Width = 1080,
	Height = 1920,
	ClickSensitivity = 10,
	DragSensitivity = 20,
	Edges = true,
	Fading = false,
	Scaling = true,
	Gradients = Fading,
	EdgeScaling = false,
	EdgeFading = Fading,
	IgnoreDistantLinks = true,
	HideBacks = true,
	Flipping = true,
	AnimatedLines = true,
	AnimationHeight = 6,
	AnimationHeight2 = 12,
	Background = "images/Hex-Background.jpg",
	
	/* === === === === === */
	
	RungCount = 12,
	
	StrandCount = 3,
	
	/* === === === === === */
	
	ClickableDistance = 0.0; //(1.0 to -1.0) Larger numbers allow farther icon clicks
	//Number of strands to display (4-360)
	//Change to constant 41 or 81 when vertical scrolling is complete?

//Globals! [Determines framerate dynamically via FPS setting]
var ImageCenter = 0,
	Icon1Size = 150,
	Icon2Size = 117,
	FPS = 60,
	Framerate = 1000/FPS,
	Speed=0,
	Count=0,
	MinSpeed = 1,
	MaxSpeed = 5,
	VerticalOffset = -150,
	WidthMultiplier = 0.30;

//Calculations!
var RungSpacing = 1/RungCount*(Height+480),
	Twist = 360 / RungCount,
	TwistHeight = -40,
	Width=Width*WidthMultiplier;

//Settings array
var Setting=[RungCount,RungSpacing,Twist,TwistHeight,Speed,VerticalOffset,Width,WidthMultiplier,FPS,ImageCenter];

//Empty globals
var canvas = $("#dnaCanvas"),
	canvas2 = $("#spdCanvas"),
	Canv = canvas,
	context = canvas[0].getContext('2d');

var DnaArray = [],
	C = {},
	G = {};

G.LHDist=0, G.SpeedTimer=0; //Last Horizontal Distance, for drag speed
G.Timer=0; //How long screen is touched
G.Icon=0; //Icon Count
G.Largest=0;
G.Mousedown=false;
G.MouseX=0, G.MouseY=0; //Current Mouse Coords
G.LastMouseX=0, G.LastMouseY=0; //Last Mouse Coords
G.Q=[]; //Drawing Queue
G.X={},G.Y={},G.Num={};
G.LastX={}, G.LastY={}, G.Strand={};
G.NewCos={}, G.SColor={}, G.HexScale={}, G.IconScale={};
for(var i=0;i<StrandCount;i++){
	G.X[i]=0;
	G.Y[i]=0;
	G.Num[i]=0;
	G.LastX[i]=0;
	G.LastY[i]=0;
	G.Strand[i]=0;
	G.NewCos[i]=0;
	G.SColor[i]="";
	G.HexScale[i]=0;
	G.IconScale[i]=0;
}
G.HotZone = {};
for(var i=0;i<RungCount*StrandCount;i++){
	G.HotZone[i]={};
}

var img=new Image();
img.src=Background;

var fpsFilter = 20; // the low pass filter to apply to the FPS average
var fpsDesired = 50; // your desired FPS, also works as a max
var fpsAverage = fpsDesired;
var timeCurrent, timeLast = Date.now();
var drawing = false;
function fpsUpdate() {
    //textAt(100,200,"FPS: "+fpsAverage.toFixed(2));
}
function frameDraw() {
    if(drawing) { return; } else { drawing = true; }

    timeCurrent = Date.now();
    var fpsThisFrame = 1000 / (timeCurrent - timeLast);
    if(timeCurrent > timeLast) {
        fpsAverage += (fpsThisFrame - fpsAverage) / fpsFilter;
        timeLast = timeCurrent;
    }

    drawing = false;
}
setInterval(frameDraw, 10 / fpsDesired);

//Constants
C = {
    "DC": Math.PI / 180
};

//Object Prototypes
DNA = function(commonContext, Twist, XVal, YVal, Height, Width, rungIcon) {
    this.x = XVal;
    this.y = YVal;
    this.radiusHeight = Height;
    this.radiusWidth = Width;
    this.revS = Math.round(Twist);
    this.Context = commonContext;
    this.rungIcon = rungIcon[0];
    this.Update();
};
DNA.prototype = {
    moveToNext: function() {
        this.revS+=Speed;
        if (this.revS > 359) this.revS = 0;
        if (this.revS < 0) this.revS = 359;
    },
    Update: function() {
        var MainArray = [];
		var b = 0;
        for (revS = 0; revS < 360; revS++) {
			var a = [];
			var rev={};
			a[0] = Math.sin(revS * C.DC);
			for(i=0;i<StrandCount;i++){
				var w=360/StrandCount; //Cut circle into wedges
				rev[i]=(revS>360-w*i)?revS-(360-w*i):revS+(w*i);
				//b is sine
				b = Math.sin(rev[i] * C.DC);
				//c is cosine, off of which scaling is based
				c=Math.cos(rev[i] * C.DC);
				a.push(c);
				//c(second var) controls distance from center
				a.push(this.x + b * this.radiusWidth);
				//d(third var) controls vertical spin
				a.push(this.y + c * this.radiusHeight);
			}

            MainArray.push(a);
        }
        this.posCacheValues = MainArray;
    },
    UpdateStrand: function(c) {
		for(i=0;i<StrandCount;i++){
			n=i*3;
			G.Strand[i]=c[n+1];	G.X[i]=c[n+2]; G.Y[i]=c[n+3];
		}
	},
    paintLines: function(offset) {
		var a = this.Context;
        this.UpdateStrand(this.posCacheValues[Math.floor(this.revS)]);
		/*
		if(offset>5) offset=5;
		this.totalOffset=offset;
			NewY=Math.floor(c[CH.Y1])+this.totalOffset;c[CH.Y1]=NewY;
			if(Math.abs(NewY-c[CH.Y1]>100)) NewY=0;
			NewY2=Math.floor(c[CH.Y2])+this.totalOffset;c[CH.Y2]=NewY2;
			if(Math.abs(NewY2-c[CH.Y2]>100)) NewY2=0;
			NextY=Math.floor(c[CH.Y1])+this.totalOffset;c[CH.Y1]=NextY;
			if(Math.abs(NextY-c[CH.Y1]>100)) NextY=0;
			NextY2=Math.floor(c[CH.Y2])+this.totalOffset;c[CH.Y2]=NextY2;
			if(Math.abs(NextY2-c[CH.Y2]>100)) NextY2=0;
			textAt(30,this.y,":: "+NextY2);
		// */
		//Draw Helix Rung to First Edge
		a.lineWidth=5.0;
		str={};
		for(var i in G.X){
		/* */
			G.NewCos[i]=(G.LastCos+G.Strand[i])/2;
			//Use the cosine value to obtain proper color gradient for helix rung
			if(Gradients){
				//Todo: Divide color in half?
				//str1="#"+getRGB(-G.Strand[i],102)+getRGB(-G.Strand[i],204)+getRGB(-G.Strand[i],256);
			}else{
				str[i]="#66CCFF";
			}
			if(Edges && EdgeFading){
				G.SColor[i]="#"+getRGB(G.NewCos[i],256)+getRGB(G.NewCos[i],256)+getRGB(G.NewCos[i],256);
			}else{
				G.SColor[i]="#FFFFFF";
			}

			a.lineWidth=2.0;
			//Draw rung to center (with gradient? Colors need to be halved!)
			if(Gradients){
				//drawLine(a,G.X[i],G.Y[i],this.x,this.y,str1,str2);
			}else{
				queueLine(a,G.X[i],G.Y[i],this.x,this.y,str[i]);
			}
			
			if(Edges){

				//Todo: Draw closer side last!
				DrawSide(a,G.Strand[i],G.X[i],G.Y[i],G.LastX[i], G.LastY[i],G.SColor[i]);
				/*
				if(G.Strand[0]>0){
					//Side 1 is closer, and should be drawn last. (Keep white over gray)
					DrawSide(a,G.Strand[0],G.X[0],G.Y[0],G.LastX[0], G.LastY[0],G.SColor[0]);
					DrawSide(a,G.Strand[1],G.X[1],G.Y[1],G.LastX[1], G.LastY[1],G.SColor[1]);
				}else{
					//Side 0 is closer
					DrawSide(a,G.Strand[1],G.X[1],G.Y[1],G.LastX[1], G.LastY[1],G.SColor[1]);
					DrawSide(a,G.Strand[0],G.X[0],G.Y[0],G.LastX[0], G.LastY[0],G.SColor[0]);
				}
				*/
			}
			//Keep track of last rung position
			G.LastX[i]=G.X[i];
			G.LastY[i]=G.Y[i];
		
		// */
		}
		G.LastCos=G.Strand[0];
    },
    paintIcons: function() {
        var a = this.Context;
        this.UpdateStrand(this.posCacheValues[Math.floor(this.revS)]);
		
		G.Icon++;Count++;
		
		if(G.Icon>IconLinks.length || this.rungIcon==0)
			G.Icon=1;
		if(Count>RungCount)
			Count=1;
		//Side Images
		var SideImg={};
		//Center Image
        var CenterImg = G.Nucleotides[this.rungIcon];

// --------------------------------------

		for(var i in G.X){
			i=parseInt(i);
			G.Num[i]=Count*StrandCount-3+i;
			
			SideImg[i] = G.Nucleotides[this.rungIcon];
			
			G.HexScale[i]=Icon1Size;
			G.IconScale[i]=Icon2Size;

			if(ImageCenter===2){}
			else if(ImageCenter)
				a.drawImage(CenterImg, this.x-(G.HexScale[0]/2), this.y-(G.HexScale[0]/2))
			else{
				//scale the images according to the cosine
				if(Scaling){
					G.HexScale[i]=rescale(G.HexScale[i],G.Strand[i]);
					G.IconScale[i]=rescale(G.IconScale[i],G.Strand[i]);
				}
				buildStrand(G.Num[i],G.X[i],G.Y[i],G.HexScale[i],G.Strand[i],IconLinks[G.Icon-1][1]);
				
				//Todo: Draw smaller images behind larger ones?
				drawPolygon(a, G.Strand[i], document.getElementById('nucleotideYellow'), G.X[i],G.Y[i],G.HexScale[i], 1);
				placeImage(a, G.Strand[i], SideImg[i], G.X[i],G.Y[i],G.IconScale[i],0,1);
				//var Canv = $("#dnaCanvas");
				//draw smaller image behind larger one, at proper alpha transparency
				/*if(G.HexScale[0]<G.HexScale[1]){
					placeImage(a, G.Strand[0], document.getElementById('nucleotideYellow'), G.X[0],G.Y[0],G.HexScale[0], 1);
					placeImage(a, G.Strand[0], SideImg[0], G.X[0],G.Y[0],G.IconScale[0]);

					placeImage(a, G.Strand[1], document.getElementById('nucleotideYellow'), G.X[1],G.Y[1],G.HexScale[1], 1);
					placeImage(a, G.Strand[1], SideImg[1], G.X[1],G.Y[1],G.IconScale[1]);
				}else{
					placeImage(a, G.Strand[1], document.getElementById('nucleotideYellow'), G.X[1],G.Y[1],G.HexScale[1], 1);
					placeImage(a, G.Strand[1], SideImg[1], G.X[1],G.Y[1],G.IconScale[1]);

					placeImage(a, G.Strand[0], document.getElementById('nucleotideYellow'), G.X[0],G.Y[0],G.HexScale[0], 1);
					placeImage(a, G.Strand[0], SideImg[0], G.X[0],G.Y[0],G.IconScale[0]);
				}*/

				//display debugging information: Bounding boxes and link text
				if (Canv.length && Canv[0].getContext && Debug){
					var Context = Canv[0].getContext("2d");
					Context.lineWidth=2.0;
					//display hotzones and function callbacks
					if(G.HotZone[G.Num[i]]["Cos"] < ClickableDistance && IgnoreDistantLinks){
						drawRect(Context,G.HotZone[G.Num[i]]["X"],G.HotZone[G.Num[i]]["Y"],G.HotZone[G.Num[i]]["X"]+G.HotZone[G.Num[i]]["S"],G.HotZone[G.Num[i]]["Y"]+G.HotZone[G.Num[i]]["S"],"#FF0000");
						textAt(G.HotZone[G.Num[i]]["X"],G.HotZone[G.Num[i]]["Y"],G.HotZone[G.Num[i]]["F"].toString().substring(13,G.HotZone[G.Num[i]]["F"].toString().length-1));
					}
					//display cosines
					textAt(G.X[i],G.Y[i], G.Strand[i]);
				}
			}
		}
    }
};
function buildStrand(N,X,Y,S,C,F){
		G.HotZone[N]={};
		G.HotZone[N]["X"]=X-(S/2);
		G.HotZone[N]["Y"]=Y-(S/2);
		G.HotZone[N]["S"]=S;
		G.HotZone[N]["Cos"]=C;
		G.HotZone[N]["F"]=F;
}

//Display Functions
var Display = function(commonContext) {
    this.commonContext = commonContext;
};
Display.prototype = {
    createStrand: function(Twist, XVal, Setting) {
	//var Setting=[1RungSpacing,2Twist,3TwistHeight,5VerticalOffset,6Width];
		Icon=Twist;
		Length=IconLinks.length;
		while(Icon>Length-1){
			Icon=Icon-Length;
		}
		var YVal=Setting[5] + Twist * Setting[1];
		var Width=Setting[6];
		var Height=Setting[3];
		Twist=Twist*Setting[2];

        //var ReturnVal = new DNA(this.commonContext, Twist, XVal, YVal, Height, Width, [Icon,Icon]); //return ReturnVal;
        return new DNA(this.commonContext, Twist, XVal, YVal, Height, Width, [Icon,Icon]);
    }
};

//Strand Definitions
var Spinner = function(fps, canvas, Context, models) {
    this.fps = fps;
    this.timeoutFnId = null;
    this.models = models;
    this.Context = Context;
    this.canvas = canvas;
    this.canvasH = canvas.height;
    this.canvasW = canvas.width;
	this.offset = 0;
    this.Update();
};
Spinner.prototype = {
    Update: function() {
        var e = [];
		for(i=0;i<RungCount;i++){
			Icon=i;
			Length=IconLinks.length;
			while(Icon>Length-1){
				Icon=Icon-Length;
			}
			e.push(IconLinks[Icon][0]);
		}
        G.Nucleotides = e;
        this.opacity = 0
    },
    play: function() {
        var b = this;
        var a = function() {
            b.frameAction(b);
        };
        this.timeoutFnId = setInterval(a, Framerate);
		G.Paused=false;
    },
    pause: function() {
        var b = this;
        clearInterval(b.timeoutFnId);
		G.Paused=true;
    },
    frameAction: function(b) {
		//redraw canvas
        b.canvas.width = b.canvas.width;
		b.Context.drawImage(img,0,0,1080,1920);
        fpsUpdate();
		//butt,round,square
        b.Context.lineCap = "round";
        if (b.opacity < 1) {
            b.opacity += 0.04;
            $(b.canvas).css("opacity", b.opacity);
        }
        var Length = b.models.length;
        for (var c = 0; c < Length; c++) {
            var d = b.models[c];
            d.moveToNext();
            d.paintLines(this.offset);
        }
        for (var c = 0; c < Length; c++) {
            var d = b.models[c];
            d.paintIcons(this.offset);
        }
		unqueue(b.Context);

		if(G.Mousedown){
			//Keep track of how long screen is touched
			G.Timer=G.Timer+1;
			if(G.Timer==1){
				//Capture the start location
				G.DragStartX=G.MouseX;
				G.DragStartY=G.MouseY;
			}else if(G.Timer>ClickSensitivity){
				//Sensitivity indicates the click is too long to run a function
				G.ClickedTooLong=true;
			}else{
				G.ClickedTooLong=false;
			}
		}else{
			if(G.Timer>0){
				//Mouse has just been let up, so capture end position
				G.DragEndX=G.MouseX;
				G.DragEndY=G.MouseY;
				if(getDistance(G.DragStartX,G.DragStartY,G.DragEndX,G.DragEndY)>DragSensitivity){
					//Dragging happened, so deactivate the clicking routine
					G.Mouseclick=false;
					G.DraggedTooFar=true;
					if(!G.ClickedTooLong && G.LastMouseX==G.MouseX){
						//Quick dragging happened, so set the molecule to spin
						G.LastMouseX=G.MouseX-G.LastDir;
					}
				}else{
					G.DraggedTooFar=false;
				}
			}
			//Reset the timer
			G.Timer=0;
		}
		
		//Visual Debugging Indicator Lights
		//if(G.ClickedTooLong) drawLine(context,10,10,20,20,"Red");
		//else drawLine(context,10,10,20,20,"Green");
		//if(G.DraggedTooFar) drawLine(context,10,30,20,40,"Red");
		//else drawLine(context,10,30,20,40,"Green");

		initDrag();
		
		//A click has been registered
		if(G.Mouseclick){
			for(i=0;i<Object.keys(G.HotZone).length;i++){
				try{
					//if the coordinates line up, and the icon isn't too far away
					if(G.LastMouseX>G.HotZone[i]["X"] && G.LastMouseX<G.HotZone[i]["X"]+G.HotZone[i]["S"] && G.HotZone[i]["Cos"] < ClickableDistance){
						if(G.LastMouseY>G.HotZone[i]["Y"] && G.LastMouseY<G.HotZone[i]["Y"]+G.HotZone[i]["S"]){
							//run the callback function
							G.HotZone[i]["F"]();
							//stop checking icons for clicks, the icon has been found!
							i=Object.keys(G.HotZone).length;
						}
					}
				}catch(e){
					console.log('Runs '+G.HotZone[i]["F"]);
				}
			}
			//stop the mouse click routine!
			G.Mouseclick=false;
		}
    }
};

//Queue Functions
function queueLine(cos,x1,y1,x2,y2,color, color2){
	G.Q.push({"o":0,"x":x1,"y":y1,"x2":x2,"y2":y2,"c":color,"t":0});
}
function queueImage(img, x, y, scalex, scaley, cos){
	G.Q.push({"o":cos,"x":x, "y":y, "x2":scalex, "y2":scaley, "c":img, "t":1});
}
function unqueue(Canvas){
	//Sort on G.Q[i]["o"]
	G.Q.sort(function(a,b) { return a.o - b.o; });
	
	for(i=G.Q.length;i>0;i--){
		if(typeof(G.Q[i])!=="undefined"){
			if(G.Q[i]["t"]==0)
			drawLine(Canvas,G.Q[i]["x"],G.Q[i]["y"],G.Q[i]["x2"],G.Q[i]["y2"],G.Q[i]["c"]);
			else
			Canvas.drawImage(G.Q[i]["c"],G.Q[i]["x"],G.Q[i]["y"],G.Q[i]["x2"], G.Q[i]["y2"]);
			G.Q.pop();
		}
	}
}

//Graphics functions
function drawLine(a,x1,y1,x2,y2,color, color2){
	if(false){
		a.beginPath();
		//Center point
		a.moveTo(x1,y1);
		//First edge point
		a.lineTo(x2,y2);
		if(color2){
			var grad=a.createLinearGradient(x1,y1,x2,y2);
			grad.addColorStop(0, color);
			grad.addColorStop(1, color2);
			a.strokeStyle = grad;
		}else{
			//darkcolor
			a.strokeStyle = color;
		}
		a.stroke();
		a.closePath();
	}
	
	dist=getDistance(x1,y1,x2,y2);
	ang=getAngle(x1,y1,x2,y2)-AnimationHeight/8; //angles were misbehaving, and Math.floor made them wibbly

	var imgPreload=document.getElementById("Particle");
	var imgPreload2=document.getElementById("Particle2");
	var img=imgPreload;
	var ah=AnimationHeight;
	if(color!=="#66CCFF"){
		 img=imgPreload2;
		 ah=AnimationHeight2;
	}
	drawRotated(ang,img,x1,y1,ah,dist,color);
}
function drawRotated(degrees,img,x1,y1,AnimationHeight,dist,image){
	context.save();
	context.translate(x1,y1);
	context.rotate(degrees*Math.PI/180);
	context.globalAlpha = 0.5;
	context.drawImage(img,0,0,dist+2,AnimationHeight); //adding pixels to dist connects all the images
	context.globalAlpha = 1.0;
	context.restore();
}
function drawPolygon(ctx, Strand, image, x, y, scale, force){
	placeImage(ctx, Strand, image, x, y, scale, force);
	/*
	//a, x, y, radius, sides, startAngle, anticlockwise
	//unneeded: image, force
	//needed: scale, color, fillcolor, startangle?
	ctx.beginPath();
	//polygon(ctx,125,125,100,5,-Math.PI/2);
		switch(true){
			case sides<1:
				return;
			case sides==1:
				ctx.fillRect(x,y,1,1);
				return;
			case sides==2:
				var a = (Math.PI * 2)/sides;
				a = anticlockwise?-a:a;
				ctx.save();
				ctx.translate(x,y);
				ctx.rotate(startAngle);
				ctx.moveTo(radius/2,0);
				break;
			default:
				var a = (Math.PI * 2)/sides;
				a = anticlockwise?-a:a;
				ctx.save();
				ctx.translate(x,y);
				ctx.rotate(startAngle);
				ctx.moveTo(radius,0);
		}
		for (var i = 1; i < sides; i++) {
			ctx.lineTo(radius*Math.cos(a*i),radius*Math.sin(a*i));
		}
		ctx.closePath();
		ctx.restore();
	context.fillStyle="rgba(227,11,93,0.75)";
	context.fill();
	context.stroke();*/
}
function drawRect(C,X1,Y1,X2,Y2,Color){
	drawLine(C,X1,Y1,X1,Y2,Color);
	drawLine(C,X1,Y1,X2,Y1,Color);
	drawLine(C,X2,Y1,X2,Y2,Color);
	drawLine(C,X1,Y2,X2,Y2,Color);
}
function DrawSide(a,cos,xval,yval,lastx,lasty,colorstr){
	//Draw Helix Side 1
	if(lasty<yval){ //Only when applicable
		if(EdgeScaling){
			a.lineWidth=(-cos+1)*5;
			if(cos>=1)
				a.lineWidth=1;
		}
		if(a.lineWidth<1)a.lineWidth=1;
		queueLine(cos, xval, yval, lastx, lasty, colorstr);
	}
}
function placeImage(canvas, cosine, img, x, y, scale, force, override){
	override = override || 0;
	if(Fading)
		canvas.globalAlpha = (cosine+1)/2;
	scalex=scale;
	if(Flipping) scalex=Math.abs(cosine)*scalex;
	if(HideBacks && !force) scalex=(cosine > 0 ? 0 : cosine)*scalex;
	scaley=scale;
	
	//canvas.drawImage(img,x-(scalex/2),y-(scaley/2),scalex,scaley);
	cosine=cosine-override; //used for culling images properly
	queueImage(img, x-(scalex/2), y-(scaley/2), scalex, scaley, cosine);
}
function getDistance(x,y,x2,y2){
	return Math.sqrt((x -= x2) * x + (y -= y2) * y);
}
function getAngle(x,y,x2,y2){
	Result=Math.atan2(y2 - y, x2 - x) * (180 / Math.PI) + 0;
	while(Result < 0)
		Result = Result + 360;
	return Result;
}
function getRGB(target,range){
	//Determine colors
	pad="00";
	str=(Math.floor((target+1)*range/2)).toString(16);
	if(target>=1) str=(range-1).toString(16);
	return pad.substring(0, 2 - str.length)+str;
}
function textAt(x,y,text){
	context.font = '18pt Calibri';
	context.fillStyle = 'white';
	context.fillText(text, x, y);
}
function writeMessage(message){
	context.clearRect(0, 0, canvas2.width, canvas2.height);
	context.font = '18pt Calibri';
	context.fillStyle = 'white';
	context.fillText(message, 15, 25);
}
function addIcon(Icon, Callback){
	var img=new Image();
	img.src=IconFolder+Icon+IconType;
	img.onload=function(){}
	IconLinks.push([img,Callback]);
}
function rescale(scale,cos){
	return scale-((cos+1)/2)*(scale/2);
}

//Input functions
function getMousePos(canvas, evt){
	var rect = canvas[0].getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}
function setMousedown(down){
	if(G.Mousedown===true && down===false && G.Timer<ClickSensitivity)
		G.Mouseclick=true;
	else
		G.Mouseclick=false;
	G.Mousedown=down;
}
function getMouseloc(evt){
	var mousePos = getMousePos(canvas, evt);
	G.MouseX = mousePos.x;
	G.MouseY = mousePos.y;
}
function initDrag(){
	if(G.LHDist!=0 && G.LHDist!=MinSpeed){ G.SpeedTimer++; }
	if(G.SpeedTimer>5){
		if(G.LHDist>MinSpeed){ G.LHDist=G.LHDist-1; }
		else if(G.LHDist<-1*MinSpeed){ G.LHDist=G.LHDist+1; }
		Speed=G.LHDist;
		G.SpeedTimer=0;
	}
	
	if(G.Mousedown){
		var dist=getDistance(G.DragStartX,G.DragStartY,G.MouseX,G.MouseY);
		if(dist>20){
			G.LHDist=Math.round(getDistance(G.LastMouseX,0,G.MouseX,0)); //Last Horizontal Distance
			if(G.LHDist>MaxSpeed){ G.LHDist=MaxSpeed; }
			if(G.MouseX>G.LastMouseX){
				G.LHDist=-1*G.LHDist;
				Speed=G.LHDist;
				G.LastDir=-1;
			}else if(G.MouseX<G.LastMouseX){
				Speed=G.LHDist;
				G.LastDir=1;
			}else{
				Speed=0;
			}
		}else{
			Speed=0;
			G.LHDist=0;
		}
		if(G.MouseY>G.LastMouseY){
			AnimateStrand.offset+=1;
		}else if(G.MouseY<G.LastMouseY){
			AnimateStrand.offset-=1;
		}
	}
	if(Debug)
		writeMessage('S:'+Speed+' Lmx:'+G.LastMouseX+' Lmy:'+G.LastMouseY+' Click:'+G.Mousedown);
	G.LastMouseX=G.MouseX;
	G.LastMouseY=G.MouseY;
}

function launchSettings(){
	if (typeof Settings === 'undefined') {
		loadScript('./common/components/settings/js/settings.js', function(path, status) {
			if (status === "ok") {
				Settings.init();
			}
		});
	} else {
		Settings.show();
	}
}
function initListeners(){
	canvas[0].addEventListener('mousedown', function(evt) {	setMousedown(true);		}, false);
	canvas[0].addEventListener('mouseup', function(evt) {	setMousedown(false);	}, false);
	canvas[0].addEventListener('mouseout', function(evt) {	setMousedown(false);	}, false);
	canvas[0].addEventListener('mousemove', function(evt) {	getMouseloc(evt);		}, false);
	
	$('#BackIcon').click(function(evt) {		tizen.application.launch("intelPoc10.HomeScreen");	}, false);
	$("#GridIcon").click(function(evt) {		$("#homeScrAppGridView").fadeIn();	}, false);
	$("#settingsIcon").click(function(evt) {	launchSettings();	}, false);
}

var Layout = new Display(context);

//Main Loop
$(function() {
	initListeners();
    AnimateStrand = null;
	//Create and call anonymous function
    (function(Setting) {
		if (AnimateStrand !== null) AnimateStrand.pause();
        if (canvas.length && canvas[0].getContext) {
			//var Setting=[0RungCount];
            for (var numStrand = 0; numStrand < Setting[0]; numStrand++) {
                DnaArray.push(Layout.createStrand(numStrand, (canvas[0].width/2), Setting));
            }
            AnimateStrand = new Spinner(FPS, canvas[0], context, DnaArray);
            AnimateStrand.play();
        }
    })(Setting);
});
