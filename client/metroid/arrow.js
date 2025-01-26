/* esm.sh - esbuild bundle(@arrow-js/core@1.0.0-alpha.10) es2022 production */
var E=new Set,P=new Set;function oe(e){if(!E.size)return e&&e(),Promise.resolve();let o,t=new Promise(n=>{o=n});return P.add(()=>{e&&e(),o()}),t}function R(e){return typeof e=="function"&&!!e.isT}function k(e){return typeof e=="object"&&e!==null&&"$on"in e&&typeof e.$on=="function"}function W(e){return"$on"in e}function H(e){return(o,t)=>{function n(){let l=Array.from(E);E.clear();let f=Array.from(P);P.clear(),l.forEach(r=>r(o,t)),f.forEach(r=>r()),E.size&&queueMicrotask(n)}E.size||queueMicrotask(n),E.add(e)}}var N={};function Q(e,o){let t=performance.now(),n=typeof o=="function";e=n?`${e} (ms)`:`${e} (calls)`;let l=n?o():o,f=n?performance.now()-t:o;return N[e]?N[e].push(f):N[e]=[f],l}var w=new Map;function A(e,o={}){if(k(e)||typeof e!="object")return e;let t=o.o||new Map,n=o.op||new Map,l=Array.isArray(e),f=[],r=l?[]:Object.create(e,{});for(let c in e){let s=e[c];typeof s=="object"&&s!==null?(r[c]=k(s)?s:A(s),f.push(c)):r[c]=s}let i=c=>(s,m)=>{let u=t.get(s),g=n.get(m);u||(u=new Set,t.set(s,u)),g||(g=new Set,n.set(m,g)),u[c](m),g[c](s)},d=i("add"),h=i("delete"),y=(c,s,m)=>{t.has(c)&&t.get(c).forEach(u=>u(s,m))},p={$on:d,$off:h,_em:y,_st:()=>({o:t,op:n,r,p:a._p}),_p:void 0},a=new Proxy(r,{has(c,s){return s in p||s in c},get(...c){let[,s]=c;if(Reflect.has(p,s))return Reflect.get(p,s);let m=Reflect.get(...c);return B(a,s),l&&s in Array.prototype?G(s,r,a,m):m},set(...c){let[s,m,u]=c,g=Reflect.get(s,m);if(Reflect.has(p,m))return Reflect.set(p,m,u);if(u&&k(g)){let b=g,C=b._st(),S=k(u)?J(u,b):A(u,C);return Reflect.set(s,m,S),y(m,S),C.o.forEach((ne,$)=>{let V=Reflect.get(g,$),D=Reflect.get(S,$);V!==D&&b._em($,D,V)}),!0}let v=Reflect.set(...c);return v&&(g!==u&&y(m,u,g),a._p&&a._p[1]._em(...a._p)),v}});return o.p&&(a._p=o.p),f.map(c=>{a[c]._p=[c,a]}),a}function B(e,o){w.forEach(t=>{let n=t.get(e);n||(n=new Set,t.set(e,n)),n.add(o)})}function G(e,o,t,n){let l=(...f)=>{let r=Array.prototype[e].call(o,...f);if(o.forEach((i,d)=>t._em(String(d),i)),t._p){let[i,d]=t._p;d._em(i,t)}return r};switch(e){case"shift":case"pop":case"sort":case"reverse":case"copyWithin":return l;case"unshift":case"push":case"fill":return(...f)=>l(...f.map(r=>A(r)));case"splice":return function(f,r,...i){return arguments.length===1?l(f):l(f,r,...i.map(d=>A(d)))};default:return n}}function J(e,o){let t=o._st();return t.o&&t.o.forEach((n,l)=>{n.forEach(f=>{e.$on(l,f)})}),t.p&&(e._p=t.p),e}function T(e,o){let t=Symbol();w.has(t)||w.set(t,new Map);let n=new Map,l=H(f);function f(){w.set(t,new Map);let r=e(),i=w.get(t);return w.delete(t),n.forEach((d,h)=>{let y=i.get(h);y&&y.forEach(_=>d.delete(_)),d.forEach(_=>h.$off(_,l))}),i.forEach((d,h)=>{d.forEach(y=>h.$on(y,l))}),n=i,o?o(r):r}return W(e)&&e.$on(f),f()}var M=new WeakMap,L={},O="\u27B3\u274D",z="\u274D\u21DA",F=`<!--${O}-->`,K=`<!--${z}-->`;function j(e,...o){let t=[],n="",l=(i,d)=>{if(typeof i=="function"){let h=()=>{};return t.push(Object.assign((...y)=>i(...y),{e:i,$on:y=>{h=y},_up:y=>{i=y,h()}})),d+F}return Array.isArray(i)?i.reduce((h,y)=>l(y,h),d):d+i},f=()=>(n||(!o.length&&e.length===1&&e[0]===""?n="<!---->":n=e.reduce(function(d,h,y){return d+=h,o[y]!==void 0?l(o[y],d):d},"")),n),r=i=>{let d=I(f()),h=x(d,{i:0,e:t});return i?h(i):h()};return r.isT=!0,r._k=0,r._h=()=>[f(),t,r._k],r.key=i=>(r._k=i,r),r}function x(e,o){let t,n=0,l=e.childNodes;for(;t=l.item(n++);){if(t.nodeType===8&&t.nodeValue===O){Z(t,o);continue}t instanceof Element&&U(t,o),t.hasChildNodes()&&x(t,o),t instanceof HTMLOptionElement&&(t.selected=t.defaultSelected)}return f=>f?(f.appendChild(e),f):e}function U(e,o){var t;let n=[],l=0,f;for(;f=e.attributes[l++];){if(o.i>=o.e.length)return;if(f.value!==F)continue;let r=f.name,i=o.e[o.i++];if(r.charAt(0)==="@"){let d=r.substring(1);e.addEventListener(d,i),M.has(e)||M.set(e,new Map),(t=M.get(e))===null||t===void 0||t.set(d,i),n.push(r)}else{let d=r==="value"&&"value"in e||r==="checked"||r.startsWith(".")&&(r=r.substring(1));T(i,h=>{d&&(e[r]=h,e.getAttribute(r)!=h&&(h=!1)),h!==!1?e.setAttribute(r,h):(e.removeAttribute(r),l--)})}}n.forEach(r=>e.removeAttribute(r))}function X(e){e.forEach(Y)}function Y(e){var o;e.remove(),(o=M.get(e))===null||o===void 0||o.forEach((t,n)=>e.removeEventListener(n,t))}function Z(e,o){var t;let n=o.e[o.i++],l;if(n&&R(n.e))l=q().add(n.e)();else{let f;l=(f=T(n,r=>ee(r,f)))()}(t=e.parentNode)===null||t===void 0||t.replaceChild(l,e)}function ee(e,o){let t=typeof o=="function",n=t?o:q();return Array.isArray(e)?e.forEach(l=>Q("partialAdd",()=>n.add(l))):n.add(e),t&&n._up(),n}function I(e){var o;let n=((o=L[e])!==null&&o!==void 0?o:(()=>{let l=document.createElement("template");return l.innerHTML=e,L[e]=l})()).content.cloneNode(!0);return n.normalize(),n}function q(e=Symbol()){let o="",t={i:0,e:[]},n=[],l=[],f=new Map,r=[],i=()=>{let p;if(n.length||h(),n.length===1&&!R(n[0].tpl)){let a=n[0];a.dom.length?a.dom[0].nodeValue=a.tpl:a.dom.push(document.createTextNode(a.tpl)),p=a.dom[0]}else p=y(x(I(o),t)());return d(),p};i.ch=()=>l,i.l=0,i.add=p=>{if(!p&&p!==0)return i;let a=[],c,s="";R(p)&&([s,a,c]=p._h()),o+=s,o+=K;let m=c&&f.get(c),u=m||{html:s,exp:a,dom:[],tpl:p,key:c};return n.push(u),c&&(m?m.exp.forEach((g,v)=>g._up(a[v].e)):f.set(c,u)),t.e.push(...a),i.l++,i},i._up=()=>{let p=q(e),a=0,c=l[0].dom[0];n.length||h(document.createComment(""));let s=()=>{if(!p.l)return;let u=p(),g=u.lastChild;c[a?"after":"before"](u),_(p,n,a),c=g};n.forEach((u,g)=>{let v=l[g];u.key&&u.dom.length?(s(),(!v||v.dom!==u.dom)&&c[g?"after":"before"](...u.dom),c=u.dom[u.dom.length-1]):v&&u.html===v.html&&!v.key?(s(),v.exp.forEach((b,C)=>b._up(u.exp[C].e)),u.exp=v.exp,u.dom=v.dom,c=u.dom[u.dom.length-1],te(u)&&c instanceof Text&&(c.nodeValue=u.tpl)):(v&&u.html!==v.html&&!v.key&&r.push(...v.dom),p.l||(a=g),p.add(u.tpl))}),s();let m=c?.nextSibling;for(;m&&e in m;)r.push(m),m=m.nextSibling;X(r),d()};let d=()=>{r.length=0,o="",i.l=0,t={i:0,e:[]},l=[...n],n=[]},h=p=>{o="<!---->",n.push({html:o,exp:[],dom:p?[p]:[],tpl:j`${o}`,key:0})},y=p=>{let a=0,c=[];return p.childNodes.forEach(s=>{if(s.nodeType===8&&s.data===z){a++,c.push(s);return}Object.defineProperty(s,e,{value:e}),n[a].dom.push(s)}),c.forEach(s=>s.remove()),p},_=(p,a,c)=>{p.ch().forEach((s,m)=>{a[c+m].dom=s.dom})};return i}function te(e){return e.dom.length===1&&!R(e.tpl)}var re=j,ce=A,se=T;export{re as html,N as measurements,oe as nextTick,A as r,ce as reactive,j as t,T as w,se as watch};
//# sourceMappingURL=core.mjs.map