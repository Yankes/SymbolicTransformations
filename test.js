
var nullExpr = (a) => a === null;
var numberExpr = (a) => typeof a === 'number';
var symbolExpr = (a) => typeof a === 'string';
var placeholderExpr = (a) => symbolExpr(a) && a.startsWith("*");
var complexExpr = (a) => !nullExpr(a) && (typeof a === 'object') && (typeof a.length === 'number') && (typeof a["type"] === 'string');

var getTypeExpr = (a) => {
  if (nullExpr(a)) return "null";
  if (numberExpr(a)) return "number";
  if (symbolExpr(a)) return "symbol";
  if (placeholderExpr(a)) return "placeholder";
  if (complexExpr(a)) return a["type"];
  throw "Expr TypeError";
}

var printExpr = (a) => {
  if (nullExpr(a)) return "null";
  if (numberExpr(a)) return "" + a + "";
  if (symbolExpr(a)) return "'" + a + "'";
  if (complexExpr(a)) return a['text'];
  throw "Expr TypeError: '" + a + "'";
}

var createMapExpr = () => {
  var container = {};
  var keyFunc = (key) => "key:" + printExpr(key);
  return {
    get: (key) => {
      var k = keyFunc(key);
      return container[k];
    },
    add: (key, value) => {
      var k = keyFunc(key);
      var old = container[k];
      if (old === undefined) {
        container[k] = value;
      } else {
        value = old;
      }
      return value;
    },
    remove: (key) => {
      var k = keyFunc(key);
      delete container[k];
    }
  }
}

var dataExpr = createMapExpr();
var unifyExpr = (d) => {
  return dataExpr.add(d, d);
}

var createExpr = function(){ 
  var d = [];
  d['type'] = arguments[0];
  var r = d['type'] + "(";
  for (var i = 1; i < arguments.length; i++) {
    var a = arguments[i];
    d[i - 1] = a;
    r += (i === 1 ? "" : ", ") + printExpr(a);
  };
  r += ")";
  d['text'] = r;
  return unifyExpr(d);
}

var transform = (x, type, func) =>{
  return createExpr(type, ...x.map(s => func(s)));
}

var fastMap = (from, to) => {
  var c = createMapExpr();
  c.add(from, to);
  return c;
}
var replace = (x, map) =>{
  var r = map.get(x);
  if (r != null) return r;
  if (complexExpr(x)) {
    return transform(x, getTypeExpr(x), f => replace(f, map))
  } else {
    return x;
  }
}

var match = (x, look, callback) => {
  if (placeholderExpr(look)) {
    var r = callback(x, look);
    if (r === undefined){
      return true;
    } else {
      return r;
    }
  }
  if (getTypeExpr(x) !== getTypeExpr(look)) return false;
  if (complexExpr(x)) {
    for (var i = 0; i < x.length; i++) {
      if (!match(x[i], look[i], callback)) {
        return false;
      }
    };
    return true;
  } else {
    return x === look;
  }
}

var add = (...args) => { return createExpr('add', ...args); }
var mul = (...args) => { return createExpr('mul',...args); }
var list = function(...args) { return createExpr('list', ...args); }

var show = (prefix, s) =>  console.log(prefix + ": " + printExpr(s));

show ('a1', 'b')
show ('a2', 5)
show ('a3', add())
console.log(replace(add('a', mul('b', 3)), fastMap(mul('b', 3), 7)))

console.log(match(add('b', mul('c')), add('*', '*'), (v, p) =>  show("match", v) ));

var func = (val, arg_def, body_def) => {
  var c = createMapExpr();
  if (match(val, arg_def, (v, p) => {  return v === c.add(p, v);; })) {
    return replace(body_def, c);
  }  
}
console.log('replace')
show("replace", replace( mul('*a', add('b', '*a')), fastMap('b', 6)))
show("func", func(add(2, 'b'), add('*a', 'b'), mul('*a', add('b', '*a'))))


var callFunction = (arg_def, body_def) => (val) => {
  show("arg", val);
  show("to match", arg_def);
  show("to result", body_def);
  var r =  func(val, arg_def, body_def);
  show("finall value", r);
  return r;
}

var toMul = callFunction(add('*b', '*b'), mul(2, '*b'));
toMul(add(mul(2, 2), mul(2, 2)))
