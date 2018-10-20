
var isNullExpr = (a) => a === null;
var isNumberExpr = (a) => typeof a === 'number';
var isSymbolExpr = (a) => typeof a === 'string';
var isPlaceholderExpr = (a) => isSymbolExpr(a) && a.startsWith("*");
var isComplexExpr = (a) => !isNullExpr(a) && (typeof a === 'object') && (typeof a.length === 'number') && (typeof a["type"] === 'string');
var isFunctionExpr = (a) => isComplexExpr(a) && a["type"] === 'function';

var getTypeExpr = (a) => {
  if (isNullExpr(a)) return "null";
  
  if (isNumberExpr(a)) return "number";
  
  if (isPlaceholderExpr(a)) return "placeholder";
  if (isSymbolExpr(a)) return "symbol";
  
  if (isComplexExpr(a)) return a["type"];
  
  throw "Expr TypeError: '" + a + "'";
}

var printExpr = (a) => {
  if (isNullExpr(a)) return "null";
  
  if (isNumberExpr(a)) return "" + a + "";
  
  if (isSymbolExpr(a)) return "'" + a + "'";
  
  if (isComplexExpr(a)) return a['text'];
  
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
  };
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
  if (isComplexExpr(x)) {
    return transform(x, getTypeExpr(x), f => replace(f, map))
  } else {
    return x;
  }
}

var match = (x, look, callback) => {
  if (isPlaceholderExpr(look)) {
    var r = callback(x, look);
    if (r === undefined){
      return true;
    } else {
      return r;
    }
  }
  if (getTypeExpr(x) !== getTypeExpr(look)) return false;
  if (isComplexExpr(x)) {
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
var list = (...args) => { return createExpr('list', ...args); }
var vect = (...args) => { return createExpr('vect', ...args); }
var func = (arg_def, body_def) => { return createExpr('function', arg_def, body_def); }

var show = (prefix, s) =>  console.log(prefix + ": " + printExpr(s));

show ('a1', 'b')
show ('a2', 5)
show ('a3', add())
console.log(replace(add('a', mul('b', 3)), fastMap(mul('b', 3), 7)))

console.log(match(add('b', mul('c')), add('*', '*'), (v, p) =>  show("match", v) ));

console.log('replace')
show("replace", replace( mul('*a', add('b', '*a')), fastMap('b', 6)))
show("func", func(add(2, 'b'), add('*a', 'b'), mul('*a', add('b', '*a'))))


var callFunction = (func, arg) => (val) => {
  if (isFunctionExpr(func)) {
    var c = createMapExpr();
    if (match(val, func[0], (v, p) => {  return v === c.add(p, v);; })) {
      return replace(func[1], c);
    }
  }
}

var toMul = callFunction(add('*b', '*b'), mul(2, '*b'));
toMul(add(mul(2, 2), mul(2, 2)))



var funcA = func(
  vect('x','y','w','z'),
  list(
    vect(mul(2, 'x'), mul(2, 'y'), add('w', 'x'), add('z', 'y'))
    vect(mul(2, 'x'), mul(2, 'y'), 'w', 'z')
  )
);
var funcB = func(
  vect('x', mul(2, 'y'),'w', mul(2, 'z')),
  list(
    vect('x', 'y', 'w', 'z')
  )
);
var funcC = func(
  vect('x', add(mul(2, 'y'), 1),'w', mul(2, 'z')),
  list(
    vect(mul(2, 'x'), add(mul(2,add(mul(3, 'y'), 1)), 1), add('w', 'x'), add(mul(3, add('z', 'y'), 1)),
    vect(mul(2, 'x'), add(mul(2, 'y'), 1), 'w', 'z')
  )
);
