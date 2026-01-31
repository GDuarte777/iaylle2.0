import{j as d,z as c,o as p}from"./index-BSbx0JO7.js";const u=()=>{const n=d.useRef(null),{theme:o}=c();return d.useEffect(()=>{const e=n.current;if(!e)return;const r=50,a=30,y=r*a;e.innerHTML="",e.style.display="grid",e.style.gridTemplateColumns=`repeat(${r}, 1fr)`,e.style.gridTemplateRows=`repeat(${a}, 1fr)`,e.style.gap="0",e.style.width="100%",e.style.height="100%",e.style.position="absolute",e.style.top="0",e.style.left="0",e.style.zIndex="-1",e.style.pointerEvents="none";for(let l=0;l<y;l++){const t=document.createElement("div"),i=Math.random()*2+1;t.style.width=`${i}px`,t.style.height=`${i}px`,t.style.borderRadius="50%",t.style.background=o==="dark"?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.1)",t.style.animation=`fade ${2+Math.random()*3}s ease-in-out infinite`,t.style.animationDelay=`${Math.random()*5}s`,e.appendChild(t)}const s=document.createElement("style");return s.textContent=`
      @keyframes fade {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.8; }
      }
    `,document.head.appendChild(s),()=>{s.remove()}},[o]),p.jsx("div",{ref:n})};export{u as D};
