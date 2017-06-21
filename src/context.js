// new features structure
let features = [
    { name: 'devicelight', value: null, callback: null },
    { name: 'devicemotion', value: null, callback: null },
    { name: 'deviceproximity', value: null, callback: null },
    { name: 'touch', value: null, callback: function() { return ('ontouchstart' in window || navigator.maxTouchPoints)?true:false } }
];
(function () {
    for(feature of features) {
        if(feature.callback == null) {
            if('on' + feature.name in window) {
                feature.supported = true;
            } else {
                feature.supported = false;
            }
        } else {
            feature.supported = feature.callback();
        }    
    }
    console.log(features);
})();
const randomNum = Math.floor(Math.random() * (900 - 701 +1)) + 701;
let root = document.querySelector("html"), contextRules = [];
class contextStyle extends HTMLElement {
    constructor() {
        super(); 
    }
    connectedCallback() {
        if(this.parentNode.host != undefined) { root = this.parentNode.host } 
        this.href();
        this.style.display = 'none';     
    }
    content(attrctx) {
        let inner = this.innerHTML;    
        if(inner.trim() != ''){
            generateContextStyles( inner.trim(), attrctx );
        } else {
            console.error('Context-Styles have not been declared, please use the href attribute or write them directly in the context-style tag.');
        }
                
    }
    href() {
        let attrctx = false;
        if(this.hasAttribute('context') && this.getAttribute('context') != "") {
            attrctx = this.getAttribute('context').replace(/>/g, '&gt;').replace(/</g, '&lt;');
        } 
        if(this.hasAttribute('href') && this.getAttribute('href') != "") {
            get(this.getAttribute('href')).then((response) => {
                let rstr = response.replace(/>/g, '&gt;').replace(/</g, '&lt;');
                generateContextStyles(rstr, attrctx);
                this.content(attrctx);
            }, (error) => {
                console.error("Failed!", error);
            });
        } else {
            console.log('href empty or non existent');
            this.content(attrctx);
        }   
    }
    
}
customElements.define('context-style', contextStyle);
/**
 * @param {array} arr
 * @param {string} symbol
 * @param {array} indc
 */
function mixedSigns(arr,symbol,indc) {
    if (arr.length == 2) {
        let left = false, tmpArr, tmpStr;
        for (let idx in arr) {            
            // check if symbol is present, &lt; or &gt;
            if(arr[idx].includes(symbol)) {
                tmpStr = arr[idx];
                arr.splice(idx,1);
                if(idx==0) {
                    left = true;
                } 
            }
        }
        // if tmpStr has been assigned value
        if(tmpStr != undefined) {
            tmpArr = tmpStr.split(symbol);
            if (left) {
                arr.unshift(tmpArr[1]);
                arr.unshift(tmpArr[0]);
                if( symbol === '&lt;') {
                    indc.left = true;
                } else {
                    indc.right = true;
                }
                
            } else {
                arr.push(tmpArr[0]);
                arr.push(tmpArr[1]);
                if( symbol === '&lt;') {
                    indc.right = true;
                } else {
                    indc.left = true;
                }
            }
        }          
        //console.log(arr);
    }
}
/**
 * @param {string} str
 */
function generateContextStyles(str, attrctx) {
    
    let contexts = str.split(/\s*@context\s*/), innerctx = true, or = /\s*,\s*|\s*or\s*/i;
    for (let i of contexts) {    
        if(i != ''){
            let rules = i.substring(i.indexOf("("),i.indexOf("{")), ruleArr, lt = '&lt;', gt = '&gt;', lteq = '&lt;=', gteq = '&gt;=';
            if(rules.includes('(') && rules.includes(')')){
                ruleArr = rules.split(or);
                if(attrctx) {
                    let andAttr = attrctx.split(or), newRuleArr = [];
                    for (let sar of andAttr) {
                        for (let y in ruleArr) {
                            newRuleArr.push( ruleArr[y] + ' and ' + sar);
                        }
                    }
                    ruleArr = newRuleArr;
                }
            } else {
                ruleArr = attrctx.split(or);
            }
            
            for (let y of ruleArr) {
                let contextRuleObj = { root: root, contexts: [],sheets: []},  arrOfObj = [], arrOfClasses = [], styles, singleStyles;
                let andArr = y.split(/\s*and\s*/i);
                for (let j of andArr) {
                    let sr = j.substring(j.indexOf("(")+1,j.indexOf(")")), ra, prcnt = '%', obj = {}, objName, incdec = {left:false,right:false};
                    if( j.includes(lt) || j.includes(gt) ) {               
                        if (sr.includes(lt) && sr.includes(gt)) {
                            console.error('you have mixed the greater than and less than symbol in an expression!');
                            return;
                        }
                    
                        if (sr.includes(lt)) {
                            if (sr.includes(lteq)) {
                                ra = sr.split(lteq);
                                mixedSigns(ra,lt,incdec);
                            } else {
                                ra = sr.split(lt);
                                incdec = {left:true,right:true};   	
                            }  
                            if(ra.length == 2) {
                                if(ra[0].includes(prcnt) || !isNaN(ra[0])) {
                                    obj.min = parseFloat(ra[0]); 
                                    obj.feature = ra[1].trim();
                                } else {
                                    obj.max = parseFloat(ra[1]); 
                                    obj.feature = ra[0].trim();                                
                                }
                            } else {
                                obj.feature = ra[1].trim();
                                obj.min = parseFloat(ra[0]);
                                obj.max = parseFloat(ra[2]);
                            }
                            
                            if( incdec.left || incdec.right ) {
                                obj.lt_gt = incdec;
                            }
                            arrOfObj.push(obj);
                        }
                        if (sr.includes(gt)) {
                            if (sr.includes(gteq)) {
                                ra = sr.split(gteq);
                                mixedSigns(ra,gt,incdec);
                            } else {
                                ra = sr.split(gt);
                                incdec = {left:true,right:true};
                            } 
                            if(ra.length == 2) {
                                if(ra[0].includes(prcnt) || !isNaN(ra[0])) {
                                    obj.max = parseFloat(ra[0]);
                                    obj.feature = ra[1].trim();
                                } else {
                                    obj.min = parseFloat(ra[1]);
                                    obj.feature = ra[0].trim();
                                }
                                
                            } else {
                                obj.feature = ra[1].trim();
                                obj.max = parseFloat(ra[0]);
                                obj.min = parseFloat(ra[2]);
                            }
                            if( incdec.left || incdec.right ) {
                                obj.lt_gt = incdec;
                            }
                            arrOfObj.push(obj);
                            
                        }
                    } else if( j.includes(':')) {                
                        let inner, a, objVal;
                        inner = j.substring(j.indexOf("(")+1,j.indexOf(")"));           
                        a = inner.split(/\s*:\s*/);
                        objName = a[0].trim();
                        obj.feature = objName;
                        objVal = parseFloat(a[1]);
                        
                        if( objName.includes('min-') || objName.includes('max-')) {
                            objName = objName.replace('min-','');
                            objName = objName.replace('max-','');
                            obj.feature = objName;
                            if(arrOfObj.length == 0) {
                                if(a[0].includes('min-')) {
                                    obj.min = objVal;
                                }
                                if(a[0].includes('max-')) {
                                    obj.max = objVal;
                                }                  
                                arrOfObj.push(obj);
                            } else {
                                for(let i of arrOfObj) {
                                    if(i.feature != obj.feature) {
                            
                                        if(a[0].includes('min-')) {
                                            obj.min = objVal;
                                        }
                                        if(a[0].includes('max-')) {
                                            obj.max = objVal;
                                        }
                                        arrOfObj.push(obj);
                                    } else {
                                        if(a[0].includes('min-')) {
                                            i.min = objVal;
                                        }
                                        if(a[0].includes('max-')) {
                                            i.max = objVal;
                                        } 
                                    }
                                }
                            } 
                        } else {
                            obj.abs = objVal;
                            arrOfObj.push(obj);
                        }
                    } else {
                        let inner = j.substring(j.indexOf("(")+1,j.indexOf(")"));
                        if(inner) {
                            obj.feature = inner;
                            obj.abs = true;
                            arrOfObj.push(obj);
                        }  
                    }
                }
                styles = (rules.includes('(') && rules.includes(')'))?i.substring(i.indexOf("{") + 1,i.lastIndexOf("}")):i;
                singleStyles = styles.split(/\s*}\s*/);
                for (let z of singleStyles){
                    let classes, attrs, classArr; 
                    classes = z.substring(0,z.indexOf("{"));
                    attrs =  z.substring(z.indexOf("{") + 1);                            
                    classArr = classes.split(/\s*,\s*/);
                    for(let sc of classArr) {
                        let obj = { element: sc.trim(), properties: attrs.trim() };
                        if(obj.element != "" || obj.properties !== "") {
                            arrOfClasses.push(obj);
                        }
                    }
                }
                // TODO prioritise the rules in context attr
                contextRuleObj.contexts = arrOfObj;
                contextRuleObj.sheets = arrOfClasses;
                contextRules.push(contextRuleObj);
            }
        }
    }
    appendStyles(contextRules);      
    // Show array on the console
    console.log(contextRules);  
}
/**   
 * @param {string} url
 */
function get(url) {
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url);
        req.onload = function() {
            if (req.status == 200) {
                resolve(req.response);
            }
            else {
                reject(Error(req.statusText));
            }
        };
        req.onerror = function() {
            reject(Error("Network Error"));
        };
        req.send();
    });
}
// Append generated styles to head tag
function appendStyles() {
    let head = document.querySelector('head'), style = document.createElement('style'), suffix = '.css-ctx-queries-', css = "";
    style.id = 'cssCtxQueriesStyleTag';
    for(let i of contextRules) {
        for(let styl of i.sheets) {
            let key = styl.element;
            if(i.root == root) {
                if(i.root.shadowRoot) {
                    if(!i.root.shadowRoot.querySelector('slot')) {
                        css += ':host(' + suffix + (randomNum + contextRules.indexOf(i)) + ') ' + key.replace('&gt;','>') + '{' + styl.properties + '}';
                    } else {
                        css +=  suffix + (randomNum + contextRules.indexOf(i)) + ' ' + key.replace('&gt;','>') + '{' + styl.properties + '}'; 
                    }
                } else {
                    if(key === 'html') {
                        css += key + suffix + (randomNum + contextRules.indexOf(i)) + '{' + styl.properties + '}';
                    } else {
                        css +=  suffix + (randomNum + contextRules.indexOf(i)) + ' ' + key.replace('&gt;','>') + '{' + styl.properties + '}'; // ">" selector
                    }
                }
            }          
        }
    }
    if(root.shadowRoot) {
        if(!root.shadowRoot.querySelector('slot')) {
            head = root.shadowRoot;
        }
    }
    if(head.querySelector('#cssCtxQueriesStyleTag')) {
        head.querySelector('#cssCtxQueriesStyleTag').appendChild(document.createTextNode(css));
    } else {
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);
    }   
}
// update features object based on event listener
/**   
 * @param {string} n
 * @param {number} v
 */
function updateFeatVal(n,v) {
    for(let i of features) {
        if(i.name == n) {
            i.value = v;
        }
    }
}
// Add and remove the classes on the root element
/**   
 * @param {string} fname
 * @param {number} val
 */
function performContextCheck(fname,val) {
    updateFeatVal(fname,val);
    //let len = contextRules.length;
    for (let i of contextRules) {
        //len--;
        let clss = 'css-ctx-queries-' + (randomNum + contextRules.indexOf(i)), b = true;
        for (let j of i.contexts) {
            let min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY; 
            for(let feature of features ){
                if(feature.name === j.feature) {
                    // Compare to values stored in Features object
                    if(feature.supported) {
                        // has an unique value either numeric or boolean
                        if(j.hasOwnProperty('abs')) {
                            if(Number.isInteger(j.abs)) {
                                if(feature.value != j.abs) {
                                    b = false;
                                }
                            } else {
                                if(!feature.value) {
                                    b = false;
                                }
                            }
                        } else {
                            // Value is in range
                            if(j.hasOwnProperty('min')) {
                                min = j.min;
                            }         
                            if(j.hasOwnProperty('max')) {
                                max = j.max;
                            }
                            if(j.hasOwnProperty('lt_gt')) {
                                if(j.lt_gt.left) {
                                    ++min;
                                } 
                                if(j.lt_gt.right) {
                                    --max;
                                }
                            }
                            if(min != -Infinity || max != Infinity) {                                  
                                if ( feature.value < min || max < feature.value) {
                                    b = false;
                                }         
                            }
                        }
                    } else {
                        b = false;
                    }
                }  
            }                                                   
        }
        
        if( b ) {
            if(!i.root.classList.contains(clss)){
                //console.log('class added ' + clss + ' within min:' + min + ' max:' + max);
                i.root.classList.add(clss);
            }       
        } else  {
            if(i.root.classList.contains(clss)) {
                //console.log('class removed ' + clss + ' within min:' + min + ' max:' + max);
                i.root.classList.remove(clss);
            }             
        }      
    
    }
}
// event listener for devicelight
window.addEventListener('devicelight', function(e) {      
    let normalised = e.value / 10; // normalise range from 0 to 100, max value on nexus 4 is 1000
    //console.log(normalised);
    performContextCheck('devicelight',Math.round(normalised));
});
// event listener for devicemotion
let acceleration = 0;
window.addEventListener('devicemotion', function(e) {
    let accel = Math.round(Math.sqrt(e.acceleration.y*e.acceleration.y + e.acceleration.x*e.acceleration.x));   
    if (accel > acceleration || accel == 0) {
        //console.log(accel);
        acceleration = accel;
        performContextCheck('devicemotion', accel);
    }
});
// event listener for devicemotion
window.addEventListener('deviceproximity', function(e) {
    let normalise = ((e.value - e.min)/(e.max - e.min)) * 100;
    performContextCheck('deviceproximity',normalise);
});
// determine whether device is touch enabled on start
performContextCheck('touch', ('ontouchstart' in window || navigator.maxTouchPoints)?true:false);