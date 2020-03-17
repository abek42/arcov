AFRAME.registerComponent('face-colors', {
        dependencies: ['geometry'],
        schema: {
          color: {default: '#FFF'}
        },
        init: function () {
          var geometry;
          var i;
          geometry = this.el.getObject3D('mesh').geometry;
          for (i = 0; i < geometry.faces.length; i++) {
            geometry.faces[i].color.set(this.data.color);
          }
          geometry.colorsNeedUpdate = true;
        }
      });

let virusTracker={total:0,active:[],killed:0,parked:[]};

function activateVirus(vir){//initialises the animation
	vir.addEventListener('animationcomplete',function(e){
		let animComp = e.detail.name;
		let entity   = e.target;
		entity.components[animComp].data.to = -entity.components[animComp].data.to;
		entity.emit(entity.components[animComp].data.startEvents[0],false);
		//console.log("DBG: Reversing",animComp,entity.components[animComp].data.startEvents[0],entity.object3D.position);
	});	
	for (let [key, value] of Object.entries(vir.components)) {
		if(key.includes("animation__")){
			vir.emit(value.data.startEvents[0],false);
			console.log("DBG: Event emitted",value.data.startEvents[0],value.data.to);
		}
	};
}

function virusFactory(src,scene){//called when new one needs to be added
		let newId = document.getElementsByClassName("vParticle").length;
		let newPos = src.object3D.position;
		
		let newVParticle = document.createElement("a-entity");
		newVParticle.setAttribute("id","cov0"+newId);
		newVParticle.setAttribute("position",[newPos.x,newPos.y,wob(newPos.z,3)].join(" "));
		newVParticle.setAttribute("mixin","fx fy");
		//let nextInstance =src.getElementsByClassName("cov")[0].cloneNode(false); //not a deep copy
		
		newVParticle.addEventListener("loaded",function(){
			console.log("Activating virus");
			for (let [key, value] of Object.entries(newVParticle.components)) {
				if(key.includes("animation__")){
					console.log(key,value.data.to);
					value.data.to = -value.data.to;
				}
			};
			activateVirus(newVParticle);
		});
		newVParticle.appendChild(buildVirus());
		scene.appendChild(newVParticle);	
}

function buildVirus(){//builds the AFrame version
	let cov = document.createElement("a-entity");
	cov.setAttribute("className","cov");
	cov.setAttribute("mixin","merge Rxyz");
	cov.setAttribute("scale","0.2 0.2 0.2");
	let capNStalk='<a-entity class="capsideNStalk" rotation="0 0 0" mixin="merge">\n'+
						'\t<a-entity mixin="ator" position="0 7 0"></a-entity>\n'+
						'\t<a-entity mixin="acyl" position="0 6 0"></a-entity>\n'+
						'\t<a-entity mixin="ator" position="0 -7 0"></a-entity>\n'+
						'\t<a-entity mixin="acyl" position="0 -6 0"></a-entity>\n'+
						'\t<a-entity mixin="asph" ></a-entity>\n'+
					'</a-entity>\n';
	let stalks="";
	let i=0;
	while(i<5){
		stalks+=buildStalk(i*72);
		i++;
	}
	cov.innerHTML=capNStalk+stalks;
	return cov;
}

function buildStalk(yr,steps=4){//factored out step
	let stalks = '<a-entity class="stalks" rotation="0 #YR 0" mixin="merge">\n#STALKS\n</a-entity>';
	let stalk = '\t<a-entity class="stalk" rotation="#XR #YR #ZR" mixin="merge">\n'+
				'\t\t<a-entity mixin="ator" position="0 7 0"></a-entity>\n'+
				'\t\t<a-entity mixin="acyl" position="0 6 0"></a-entity>\n'+
				'\t</a-entity>';
	let stalkLst=[];
	let deltaT = 180/(steps+1);
	for(let i=1;i<=steps;i++){
		stalkLst.push(stalk.replace("#XR",wob(0,10)).replace("#YR",wob(0,15)).replace("#ZR",wob(0,10)+(i)*deltaT));	
	}
	return stalks.replace("#YR",wob(yr,10)).replace("#STALKS",stalkLst.join("\n"));
}

function wob(cVal,rng){//wobble... central value cVal, range on either side rng
	return cVal + Math.floor(Math.random()*2*rng+1)-rng;
	
}