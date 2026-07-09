import{c as o,f as s}from"./index-DmxRx2oB.js";/**
 * @license lucide-react v0.483.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M7 3v18",key:"bbkbws"}],["path",{d:"M3 7.5h4",key:"zfgn84"}],["path",{d:"M3 12h18",key:"1i2n21"}],["path",{d:"M3 16.5h4",key:"1230mu"}],["path",{d:"M17 3v18",key:"in4fa5"}],["path",{d:"M17 7.5h4",key:"myr1c1"}],["path",{d:"M17 16.5h4",key:"go4c1d"}]],r=o("Film",i);/**
 * @license lucide-react v0.483.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"M13.234 20.252 21 12.3",key:"1cbrk9"}],["path",{d:"m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486",key:"1pkts6"}]],l=o("Paperclip",d);async function h(a){const{data:t}=await s.get(`/lessons/course/${a}`);return t.data}async function y(a){const{data:t}=await s.get(`/lessons/${a}`);return t.data}async function u(a,t,e){const{data:n}=await s.post(`/lessons/${a}/sections/${t}`,e);return n.data}async function k(a,t){const{data:e}=await s.put(`/lessons/${a}`,t);return e.data}async function $(a){await s.delete(`/lessons/${a}`)}async function f(a){const{data:t}=await s.get(`/lessons/${a}/video-url`),e=t.data,c=`${"https://api.veo-lms.bhupeshb7.me/api".replace(/\/$/,"")}/videos/stream`;return{...e,fileUrl:e.playlistPath?`${c}/${e.playlistPath.replace(/^\//,"")}?token=${encodeURIComponent(e.token)}`:""}}export{r as F,l as P,f as a,h as b,u as c,$ as d,y as g,k as u};
