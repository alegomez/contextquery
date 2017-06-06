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
            if(feature.name in window) {
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
    
    let contexts = str.split(/\s*@context\s*/), innerctx = true, or = /\s*,\s*|\s*or\s*|\s*OR\s*/ ;
    contexts.splice(0,1);
    if(contexts.length < 1 && attrctx ) {
        contexts = [];
        let andAttr = attrctx.split(or), cnt = 0;
        for (let sar of andAttr) {
            contexts[cnt++] = sar + '{' + str + '}}';
        }
        innerctx = false;
    }
    for (let i of contexts) {
        
        let rules, ruleArr, lt = '&lt;', gt = '&gt;', lteq = '&lt;=', gteq = '&gt;=';
        rules = i.substring(i.indexOf("("),i.indexOf("{"));
        ruleArr = rules.split(or);

        if(innerctx && attrctx) {
            let andAttr = attrctx.split(or), newRuleArr = [];
            for (let sar of andAttr) {
                for (let y in ruleArr) {
                    newRuleArr.push( ruleArr[y] + ' and ' + sar);
                }
            }
            ruleArr = newRuleArr;
        }

        for (let y of ruleArr) {
            let arr = [],  arrOfObj = [], arrOfClasses = [], styles, singleStyles;
            let andArr = y.split(/\s*and\s*|\s*AND\s*/);

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
                } else if( j.includes('min-') || j.includes('max-')) {                
                    let inner, a, incmin = 'min-', incmax = 'max-', objVal;
                    inner = j.substring(j.indexOf("(")+1,j.indexOf(")"));           
                    a = inner.split(/\s*:\s*/);

                    objName = a[0].trim();
                    objName = objName.replace('min-','');
                    objName = objName.replace('max-','');

                    obj.feature = objName;
                    objVal = parseFloat(a[1]);
                    
                        
                    if(arrOfObj.length == 0) {
                        if(a[0].includes(incmin)) {
                            obj.min = objVal;
                        }

                        if(a[0].includes(incmax)) {
                            obj.max = objVal;
                        }                  
                        arrOfObj.push(obj);
                    } else {
                        for(let i of arrOfObj) {
                            if(i.feature != obj.feature) {
                    
                                if(a[0].includes(incmin)) {
                                    obj.min = objVal;
                                }

                                if(a[0].includes(incmax)) {
                                    obj.max = objVal;
                                }
                                arrOfObj.push(obj);
                            } else {
                                if(a[0].includes(incmin)) {
                                    i.min = objVal;
                                }

                                if(a[0].includes(incmax)) {
                                    i.max = objVal;
                                } 
                            }
                        }
                    }      
                } else {
                    let inner = j.substring(j.indexOf("(")+1,j.indexOf(")"));
                    obj.feature = inner;
                    obj.abs = 1;
                    arrOfObj.push(obj);
                }
            }

            styles = i.substring(i.indexOf("{") + 1,i.lastIndexOf("}"));
            singleStyles = styles.split(/\s*}\s*/);
            singleStyles.pop();
            
            for (let z of singleStyles){
                let classes, attrs, classArr; 
                classes = z.substring(0,z.indexOf("{"));
                attrs =  z.substring(z.indexOf("{") + 1);                            
                classArr = classes.split(/\s*,\s*/);
                for(let sc of classArr) {
                    let obj = { element: sc.trim(), properties: attrs.trim() };
                    if(obj.properties !== "") {
                        arrOfClasses.push(obj);
                    }
                }
            }  
            arr.push(arrOfObj);      
            arr.push(arrOfClasses); 
            
            contextRules.push(arr);
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
    let head = document.querySelector('head'), style = document.createElement('style'), len = contextRules.length, 
    suffix = '.css-ctx-queries-', css = "";
    style.type = 'text/css';
    style.id = 'cssCtxQueriesStyleTag';
    for(let i of contextRules) {
        len--;
        for(let styl of i[1]) {
            let key = styl.element;
            if(key === 'html') {
                css += key + suffix + (randomNum + len) + '{' + styl.properties + '}';
            } else {
                css +=  suffix + (randomNum + len) + ' ' + key.replace('&gt;','>') + '{' + styl.properties + '}'; // ">" selector
            }            
        }
    }
    if(document.getElementById('cssCtxQueriesStyleTag')) {
        document.getElementById('cssCtxQueriesStyleTag').innerHTML = "";
        document.getElementById('cssCtxQueriesStyleTag').appendChild(document.createTextNode(css));
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

// Add and remove the classes on the html tag
/**   
 * @param {string} fname
 * @param {number} val
 */

function performContextCheck(fname,val) {
    updateFeatVal(fname,val);
    let len = contextRules.length;
    for (let i of contextRules) {
        len--;
        let clss = 'css-ctx-queries-' + (randomNum + len), b = true;
        for (let j of i[0]) {
            let min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY; 

            // Compare to values stored in Features object
            for(let feature of features ){
                if(feature.name === j.feature) {

                    // is it a boolean feature
                    if(j.hasOwnProperty('abs')) {
                        if(!feature.value) {
                            b = false;
                        }
                    } else {
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
            
                }       
            }
                                                
        }
        
        if( b ) {
            if(!root.classList.contains(clss)){
                //console.log('class added ' + clss + ' within min:' + min + ' max:' + max);
                root.classList.add(clss);
            }       
        } else  {
            if(root.classList.contains(clss)) {
                //console.log('class removed ' + clss + ' within min:' + min + ' max:' + max);
                root.classList.remove(clss);
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