start
	= hierarchy:hierarchy motion:motion { return {hierarchy: hierarchy, motion: motion}; }
    
hierarchy
	= "HIERARCHY" nl
      node:node
      { return node; }

node
	= _? type:nodeHeader nl
      _? "{" nl
      members:(nodeMember)+
      _? "}" nl
      {
          var r = {type: type, child: []};
          for (var i = 0; i < members.length; ++i) {
              var member = members[i];
              if (member.type == "OFFSET") {
                  r.offset = member.data;
              } else if (member.type == "CHANNELS") {
                  r.channels = member.data;
              } else {
                  r.child.push(member.data);
              }
          }
          return r;
      }
    
nodeHeader
	= "ROOT" _ identifier { return "ROOT"; }
    / "JOINT" _ identifier { return "JOINT"; }
    / "End Site" { return "End Site"; }
    
nodeMember
	= _? "OFFSET" _ tx:number _ ty:number _ tz:number _? nl
      { return {type: "OFFSET", data: [tx, ty, tz]}; }
    / _? "CHANNELS" _ number data:(_ identifier)+ _? nl
      { return {type: "CHANNELS", data: data.map(x => x[1])}; }
    / node:node
      { return {type: "NODE", data: node}; }
    
motion
	= "MOTION" nl
      "Frames:" _ frameNum:number nl
      "Frame Time:" _ frameTime:number nl
      frames:(frame nl?)+
      { return {frameNum: frameNum, frameTime: frameTime, frames: frames.map(x => x[0])}; }
    
frame
	= numbers:(number _?)+ { return numbers.map(x => x[0]); }
    
number
	= [+-.0-9e]+ { return parseFloat(text()); }
    
identifier
	= [a-zA-Z0-9_]+ { return text(); }
    
_ "whitespace"
	= [ \t]+

nl "newline"
	= [\n\r]+
