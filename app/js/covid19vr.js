const _ACTIVE=0; //is animating
const _WASHED=1; //hidden, needs to be set to _INACTV after making visible
const _INACTV=2; //resting, pop-upable
const _NOTIFY_WIN="WIN";
const _NOTIFY_LOSS="LOSE";
const _WASHED_MOLE=5;
const _NO_MOR_ACTV=6;
const _POPPED_DOWN=7;


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

function virusFactory(id){//called when new one needs to be added	
		if(!gltf) glft=false;
		let newVParticle = getEntity([{key:"id",val:"cov"+(id>9?"":"0")+id},{key:"class",val:"vParticle"}]);
		newVParticle.appendChild(buildVirus(gltf));
		//parentEl.appendChild(newVParticle);
		return newVParticle;
}

function buildVirus(gltf=false){//builds the AFrame version
	if(!gltf){
		let cov = document.createElement("a-entity");
		cov.setAttribute("className","cov");
		cov.setAttribute("mixin","merge Rxyz washOutE");
		cov.setAttribute("material","opacity: 1.0; transparent: true");
		cov.setAttribute("scale","0.12 0.12 0.12");
		let capNStalk='<a-entity class="capsideNStalk" rotation="0 0 0" mixin="merge">\n'+
							'\t<a-entity mixin="ator" position="0 7 0"></a-entity>\n'+
							'\t<a-entity mixin="acyl" position="0 6 0"></a-entity>\n'+
							'\t<a-entity mixin="ator" position="0 -7 0"></a-entity>\n'+
							'\t<a-entity mixin="acyl" position="0 -6 0"></a-entity>\n'+
							'\t<a-entity mixin="asph" class="capsid"></a-entity>\n'+
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
	else{
		let cov=document.createElement("a-gltf-model");
		cov.setAttribute("className","cov");
		cov.setAttribute("mixin","Rxyz washOutE");
		cov.setAttribute("material","opacity: 1.0; transparent: true");
		cov.setAttribute("scale","1 1 1");
		cov.setAttribute("src","#vpgltf");
		return cov;
	}
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
	return cVal + Math.floor(Math.random()*(rng+1))*(Math.random()<0.5?-1:1);
	
}

function chkState(refState=_ACTIVE){
	return this.state==refState;	
}

function setState(refState){
	
	//console.log("DBG: setState",this.covoleNode.id,"transition:",mapState(this.state)+">"+mapState(refState));
	this.state=refState;
}