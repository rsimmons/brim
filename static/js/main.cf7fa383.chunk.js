(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{14:function(e,t,r){},15:function(e,t,r){},19:function(e,t,r){},20:function(e,t,r){"use strict";r.r(t);var n=r(0),i=r.n(n),a=r(7),o=r.n(a),s=(r(14),r(15),r(3)),l=r(2),u=r(5),c=r(4),d=function(){return Math.random().toString(16).substring(2,10)},f=function(){return d()+d()};function m(e){return"Program"===e.type}function E(e){return function(e){return"UndefinedExpression"===e.type}(e)||function(e){return"IntegerLiteral"===e.type}(e)||p(e)||function(e){return"StreamReference"===e.type}(e)}function p(e){return"ArrayLiteral"===e.type}var y={Program:{fields:{expressions:{type:"nodes"}}},Identifier:{fields:{name:{type:"value"}}},UndefinedExpression:{fields:{streamId:{type:"uid"},identifier:{type:"node"}}},IntegerLiteral:{fields:{streamId:{type:"uid"},identifier:{type:"node"},value:{type:"value"}}},ArrayLiteral:{fields:{streamId:{type:"uid"},identifier:{type:"node"},items:{type:"nodes"}}},StreamReference:{fields:{streamId:{type:"uid"},targetStreamId:{type:"uid"}}}},h={Expression:["UndefinedExpression","IntegerLiteral","ArrayLiteral","StreamReference"],Any:["Program","Identifier","UndefinedExpression","IntegerLiteral","ArrayLiteral","StreamReference"]};function v(e,t){var r=e,n=!0,i=!1,a=void 0;try{for(var o,s=t[Symbol.iterator]();!(n=(o=s.next()).done);n=!0){r=r[o.value]}}catch(l){i=!0,a=l}finally{try{n||null==s.return||s.return()}finally{if(i)throw a}}return r}function w(e,t,r){var n=t,i=0,a=!0,o=!1,s=void 0;try{for(var l,u=r[Symbol.iterator]();!(a=(l=u.next()).done);a=!0){var c=l.value;if(e===n)return[r.slice(0,i),r.slice(i)];n=n[c],i++}}catch(d){o=!0,s=d}finally{try{a||null==u.return||u.return()}finally{if(o)throw s}}if(e===n)return[r.slice(0,i),r.slice(i)];throw new Error("node was not in path")}var b=function(e,t){return JSON.stringify(e)===JSON.stringify(t)};var g=[["Program",["MOVE_UP","MOVE_DOWN"],function(e){var t=e.node,r=e.subpath,n=e.action;if(!m(t))throw new Error;if(2===r.length&&"expressions"===r[0])return[t,["expressions",function(){var e=r[1];if("number"!==typeof e)throw new Error;var i=e+("MOVE_UP"===n.type?-1:1);return i=Math.max(i,0),i=Math.min(i,t.expressions.length-1)}()],!1]}],["Program",["DELETE"],function(e){var t=e.node,r=e.subpath;if(!m(t))throw new Error;if(2===r.length&&"expressions"===r[0]){var n=r[1];if("number"!==typeof n)throw new Error;return function(e,t){if("number"!==typeof t)throw new Error;var r=Object(c.a)({},e,{expressions:[].concat(Object(s.a)(e.expressions.slice(0,t)),Object(s.a)(e.expressions.slice(t+1)))});if(r.expressions.length){var n=t-1;return n=Math.max(n,0),[r,["expressions",n=Math.min(n,e.expressions.length-1)],!1]}return r.expressions.push({type:"UndefinedExpression",streamId:f(),identifier:null}),[r,["expressions",0],!0]}(t,n)}}],["Expression",["BEGIN_EDIT"],function(e){var t=e.node,r=e.subpath;switch(t.type){case"IntegerLiteral":case"UndefinedExpression":return[t,r,!0];case"ArrayLiteral":break;default:throw new Error}}],["Expression",["BEGIN_EDIT_FRESH"],function(e){var t=e.node,r=e.subpath;if(!E(t))throw new Error;return[{type:"UndefinedExpression",streamId:t.streamId,identifier:t.identifier},r,!0]}],["Expression",["END_EXPRESSION_EDIT"],function(e){return[e.node,e.subpath,!1]}],["Expression",["END_EXPRESSION_IDENTIFIER_EDIT"],function(e){var t=e.node,r=e.subpath;if(!E(t))throw new Error;if(!b(r,["identifier"]))throw new Error;if(!t.identifier)throw new Error;var n=t.identifier.name.trim();return[Object(c.a)({},t,{identifier:n?{type:"Identifier",name:n}:null}),[],!1]}],["Any",["UPDATE_NODE"],function(e){var t=e.subpath,r=e.action,n=e.editingSelected;if(!r.newNode)throw new Error;if(0===t.length)return[r.newNode,t,n]}],["Program",["INSERT_AFTER"],function(e){var t=e.node,r=e.subpath;if(!m(t))throw new Error;if(r.length>=2&&"expressions"===r[0]){var n=r[1];if("number"!==typeof n)throw new Error;return[Object(c.a)({},t,{expressions:[].concat(Object(s.a)(t.expressions.slice(0,n+1)),[{type:"UndefinedExpression",streamId:f(),identifier:null}],Object(s.a)(t.expressions.slice(n+1)))}),["expressions",n+1],!0]}}],["Expression",["NAME"],function(e){var t=e.node,r=e.subpath;if(!E(t))throw new Error;if(b(r,[]))return[Object(c.a)({},t,{identifier:t.identifier?t.identifier:{type:"Identifier",name:""}}),["identifier"],!0]}],["ArrayLiteral",["ZOOM_OUT","MOVE_LEFT"],function(e){var t=e.node,r=e.subpath;if(2===r.length){if("items"!==r[0]||"number"!==typeof r[1])throw Error();return[t,[],!1]}}],["ArrayLiteral",["ZOOM_IN","MOVE_RIGHT"],function(e){var t=e.node,r=e.subpath;if(!p(t))throw new Error;if(0===r.length)return 0===t.items.length?[Object(c.a)({},t,{items:[{type:"UndefinedExpression",streamId:f(),identifier:null}]}),["items",0],!0]:[t,["items",0],!1]}],["ArrayLiteral",["MOVE_UP","MOVE_DOWN"],function(e){var t=e.node,r=e.subpath,n=e.action;if(!p(t))throw new Error;if(2===r.length&&"items"===r[0]){var i=r[1];if("number"!==typeof i)throw new Error;var a=i+("MOVE_UP"===n.type?-1:1);return a<0||a>=t.items.length?[t,[],!1]:[t,["items",a],!1]}}],["ArrayLiteral",["INSERT_AFTER"],function(e){var t=e.node,r=e.subpath;if(!p(t))throw new Error;if(2===r.length&&"items"===r[0]){var n=r[1];if("number"!==typeof n)throw new Error;return[Object(c.a)({},t,{items:[].concat(Object(s.a)(t.items.slice(0,n+1)),[{type:"UndefinedExpression",streamId:f(),identifier:null}],Object(s.a)(t.items.slice(n+1)))}),["items",n+1],!0]}}],["ArrayLiteral",["DELETE"],function(e){var t=e.node,r=e.subpath;if(!p(t))throw new Error;if(2===r.length){if(0===t.items.length)throw new Error;var n=r[1];if("number"!==typeof n)throw new Error;var i=Object(c.a)({},t,{items:[].concat(Object(s.a)(t.items.slice(0,n)),Object(s.a)(t.items.slice(n+1)))});if(i.items.length>0){var a=n-1;return a=Math.max(a,0),[i,["items",a=Math.min(a,t.items.length-1)],!1]}return[i,[],!1]}}],["Expression",["CREATE_ARRAY"],function(e){var t=e.node,r=e.subpath;if(!E(t))throw new Error;if(0===r.length)return[{type:"ArrayLiteral",streamId:t.streamId,identifier:t.identifier,items:[{type:"UndefinedExpression",identifier:null,streamId:f()}]},["items",0],!0]}]];function I(e,t,r){if(!function(e,t,r){if(e===t)return!0;var n=t,i=!0,a=!1,o=void 0;try{for(var s,l=r[Symbol.iterator]();!(i=(s=l.next()).done);i=!0)if(e===(n=n[s.value]))return!0}catch(u){a=!0,o=u}finally{try{i||null==l.return||l.return()}finally{if(a)throw o}}return!1}(t,e.root,e.selectionPath))return null;var n=y[t.type];if(!n)throw new Error;for(var i={type:t.type},a=null,o=!1,s=!1,u=t,c=0,d=Object.entries(n.fields);c<d.length;c++){var f=d[c],p=Object(l.a)(f,2),v=p[0];switch(p[1].type){case"node":var b=u[v],x=I(e,b,r);if(x){if(s)throw new Error("already handled");var O=Object(l.a)(x,3),N=O[0],j=O[1],S=O[2];i[v]=N,a=j,o=S,s=!0}else i[v]=b;break;case"nodes":var _=[],T=u[v],L=!0,D=!1,A=void 0;try{for(var P,R=T[Symbol.iterator]();!(L=(P=R.next()).done);L=!0){var U=P.value,k=I(e,U,r);if(k){if(s)throw new Error("already handled");var M=Object(l.a)(k,3),C=M[0],F=M[1],V=M[2];_.push(C),a=F,o=V,s=!0}else _.push(U)}}catch(re){D=!0,A=re}finally{try{L||null==R.return||R.return()}finally{if(D)throw A}}i[v]=_;break;case"value":case"uid":i[v]=u[v];break;default:throw new Error}}if(s){if(!function(e){return m(e)||function(e){return"Identifier"===e.type}(e)||E(e)}(i))throw new Error;if(!a)throw new Error;return[i,a,o]}for(var B=0,K=g;B<K.length;B++){var G=K[B],W=Object(l.a)(G,3),X=W[0],H=W[1],J=W[2];if((h[X]?h[X]:[X]).includes(t.type)&&H.includes(r.type)){var Z=w(t,e.root,e.selectionPath),z=Object(l.a)(Z,2),Y=z[0],$=J({node:t,subpath:z[1],editingSelected:e.editingSelected,action:r});if($){console.log("handlerResult",$);var q=Object(l.a)($,3),Q=q[0],ee=q[1],te=q[2];return[Q,Y.concat(ee),te]}}}return null}function x(e,t){console.log("action",t.type);var r=I(e,e.root,t);if(r){console.log("handled");var n=Object(l.a)(r,3),i=n[0],a=n[1],o=n[2];if(console.log("new selectionPath is",a,"newEditingSelected is",o),!m(i))throw new Error;return{root:i,selectionPath:a,editingSelected:o}}return console.log("not handled"),e}var O={root:{type:"Program",expressions:[{type:"IntegerLiteral",streamId:f(),identifier:{type:"Identifier",name:"foo"},value:123},{type:"IntegerLiteral",streamId:f(),identifier:null,value:456},{type:"IntegerLiteral",streamId:f(),identifier:{type:"Identifier",name:"bar"},value:789},{type:"ArrayLiteral",streamId:f(),identifier:{type:"Identifier",name:"an array literal"},items:[{type:"IntegerLiteral",streamId:f(),identifier:null,value:123},{type:"ArrayLiteral",streamId:f(),identifier:{type:"Identifier",name:"nice subarray"},items:[{type:"IntegerLiteral",streamId:f(),identifier:null,value:345},{type:"IntegerLiteral",streamId:f(),identifier:null,value:456}]},{type:"IntegerLiteral",streamId:f(),identifier:null,value:234}]},{type:"UndefinedExpression",streamId:f(),identifier:{type:"Identifier",name:"quux"}}]},selectionPath:["expressions",0],editingSelected:!1},N=/^[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?$/;function j(e){var t=e.node,r=e.dispatch,a=Object(n.useState)(function(){switch(t.type){case"UndefinedExpression":return"";case"IntegerLiteral":return t.value.toString();default:throw new Error}}),o=Object(l.a)(a,2),s=o[0],u=o[1];return i.a.createElement("div",null,i.a.createElement("input",{className:"Editor-text-edit-input",value:s,onChange:function(e){var n=e.target.value;u(n),"["===n?(r({type:"END_EXPRESSION_EDIT"}),r({type:"CREATE_ARRAY"})):N.test(n)?r({type:"UPDATE_NODE",newNode:{type:"IntegerLiteral",streamId:t.streamId,identifier:t.identifier,value:Number(n)}}):r({type:"UPDATE_NODE",newNode:{type:"UndefinedExpression",streamId:t.streamId,identifier:t.identifier}})},onKeyDown:function(e){switch(e.key){case"Enter":e.stopPropagation(),r({type:"END_EXPRESSION_EDIT"});break;case"Backspace":e.target.value||(r({type:"END_EXPRESSION_EDIT"}),r({type:"DELETE"}))}},autoFocus:!0}))}r(19);var S={MOVE_UP:"up",MOVE_DOWN:"down",MOVE_LEFT:"left",MOVE_RIGHT:"right",ZOOM_IN:"shift+right",ZOOM_OUT:"shift+left",BEGIN_EDIT:"enter",INSERT_AFTER:[";",","],DELETE:"backspace",NAME:"="},_=["=",";",","],T=Object(n.createContext)(),L=Object(n.createContext)();function D(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";return e===Object(n.useContext)(L)?t+" Editor-selected":t}var A=Object(n.createContext)();function P(e){var t=e.program;return i.a.createElement("div",{className:"Editor-program"},t.expressions.map(function(e){return i.a.createElement("div",{className:"Editor-program-expression",key:e.streamId},i.a.createElement(B,{expression:e}))}))}function R(e){var t=e.initialName,r=e.onUpdateName,a=e.onEndEdit,o=Object(n.useState)(t||""),s=Object(l.a)(o,2),u=s[0],c=s[1];return i.a.createElement("div",null,i.a.createElement("input",{className:"Editor-text-edit-input",value:u,onChange:function(e){var t=e.target.value;c(t),r&&r(t)},onKeyDown:function(e){switch(e.key){case"Enter":e.stopPropagation(),a&&a()}},autoFocus:!0}))}function U(e){return e.identifier.name}function k(e){var t=e.expression.identifier,r=t===Object(n.useContext)(L),a=Object(n.useContext)(A),o=Object(n.useContext)(T);return i.a.createElement("div",{className:D(t)},r&&a?i.a.createElement(R,{initialName:t.name,onUpdateName:function(e){o({type:"UPDATE_NODE",newNode:{type:"Identifier",name:e}})},onEndEdit:function(){o({type:"END_EXPRESSION_IDENTIFIER_EDIT"})}}):i.a.createElement(U,{identifier:t}))}function M(e){var t=e.integerLiteral;return i.a.createElement("div",null,t.value)}function C(e){var t=e.arrayLiteral;return i.a.createElement("div",null,i.a.createElement("div",null,"["),i.a.createElement("div",{className:"Editor-array-items"},t.items.map(function(e){return i.a.createElement("div",{className:"Editor-array-item",key:e.streamId},i.a.createElement(B,{expression:e}))})),i.a.createElement("div",null,"]"))}function F(e){e.undefinedExpression;return i.a.createElement("div",{className:"Editor-undefined-expression"},"\xa0")}function V(e){var t=e.expression;switch(t.type){case"IntegerLiteral":return i.a.createElement(M,{integerLiteral:t});case"ArrayLiteral":return i.a.createElement(C,{arrayLiteral:t});case"UndefinedExpression":return i.a.createElement(F,{undefinedExpression:t});default:throw new Error}}function B(e){var t=e.expression,r=t===Object(n.useContext)(L),a=Object(n.useContext)(A),o=Object(n.useContext)(T);return i.a.createElement("div",{className:D(t,"Editor-expression")},i.a.createElement("div",{className:"Editor-expression-main"},r&&a?i.a.createElement(j,{node:t,dispatch:o}):i.a.createElement(V,{expression:t})),t.identifier?i.a.createElement("div",{className:"Editor-expression-identifier"},i.a.createElement(k,{expression:t})):null)}function K(e){var t=e.autoFocus,r=Object(n.useReducer)(x,O),a=Object(l.a)(r,2),o=a[0],c=a[1],d=Object(n.useRef)(),f=Object(n.useState)(t),m=Object(l.a)(f,1)[0];Object(n.useEffect)(function(){m&&d.current.focus()},[m]);var E=Object(n.useRef)(!1);Object(n.useEffect)(function(){E.current&&!o.editingSelected&&d.current.focus(),E.current=o.editingSelected});for(var p={},y=function(){var e=w[h];p[e]=function(t){t.preventDefault(),c({type:e})}},h=0,w=Object.keys(S);h<w.length;h++)y();return i.a.createElement(u.HotKeys,{keyMap:S,handlers:p},i.a.createElement(u.ObserveKeys,{only:_},i.a.createElement("div",{className:"Editor",onKeyDown:function(e){"input"===e.target.tagName.toLowerCase()||1!==Object(s.a)(e.key).length||e.altkey||e.ctrlKey||e.metaKey||_.includes(e.key)||c({type:"BEGIN_EDIT_FRESH"})},tabIndex:"0",ref:d},i.a.createElement(T.Provider,{value:c},i.a.createElement(L.Provider,{value:v(o.root,o.selectionPath)},i.a.createElement(A.Provider,{value:o.editingSelected},i.a.createElement(P,{program:o.root})))))))}var G=function(){return i.a.createElement("div",{className:"App"},i.a.createElement(K,{autoFocus:!0}),i.a.createElement("div",null,i.a.createElement("h2",null,"Notes"),i.a.createElement("ul",null,i.a.createElement("li",null,i.a.createElement("strong",null,"The goal of this is to explore if there's a good way to do keyboard-driven structured code editing that doesn't suck. To not suck, I believe that there must be a very small number of keyboard commands, and they should be rather intuitive/obvious. As a bonus, it would be nice if it behaved similarly to spreadsheets or normal programming editors.")),i.a.createElement("li",null,"Warning: A bunch of shit only half-works."),i.a.createElement("li",null,"If you don't see a green selection/cursor box, focus the editor."),i.a.createElement("li",null,"There's no mouse/touch support yet, only keyboard."),i.a.createElement("li",null,'The AST always stays "well-formed", but some bits are allowed to be temporarily unspecified or invalid. The program may still be able to run with unspecified values, and it will be very clear to the user (red boxes) what is invalid/missing.'),i.a.createElement("li",null,"This code doesn't yet \"run\", it's just a fake language for now."),i.a.createElement("li",null,"Up/down arrows move up and down between expressions and array items."),i.a.createElement("li",null,'Shift-left (or just left, if unambiguous) "zooms out" selection and shift-right (Or just right, if unambiguous) "zooms in" selection (into nested structures).'),i.a.createElement("li",null,"Pressing enter on an expression (or sub-expression) will begin editing it. Pressing enter again will stop editing."),i.a.createElement("li",null,"Instead of pressing enter, you can just start typing letters/numbers and it will begin the edit (overwriting what it there)."),i.a.createElement("li",null,"Pressing the = key on on an expression will move to editing its name."),i.a.createElement("li",null,"A red box indicates an undefined expression."),i.a.createElement("li",null,"If you enter an invalid number as an expression, it will ignore it and leave an undefined box."),i.a.createElement("li",null,"Semicolon or comma (interchangeable) will both add a new assignment or array item below the current one (even during a text edit)."),i.a.createElement("li",null,"Delete will delete expressions, array items, etc."),i.a.createElement("li",null,"Typeing just [ when editing an expression will create an array literal."),i.a.createElement("li",null,i.a.createElement("strong",null,"TODO")," Escape will revert any in-progress edit."))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(i.a.createElement(G,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})},8:function(e,t,r){e.exports=r(20)}},[[8,1,2]]]);
//# sourceMappingURL=main.cf7fa383.chunk.js.map