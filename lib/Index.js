(function() {
  var BitArray, Index, _compareTerms, _createTerm,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  BitArray = require('bit-array');

  Index = (function() {

    function Index() {
      this.getIndexesForTerm = __bind(this.getIndexesForTerm, this);
      this.getIndexesForTermSync = __bind(this.getIndexesForTermSync, this);
      this.getTerms = __bind(this.getTerms, this);
      this.getItem = __bind(this.getItem, this);
      this.resizeAllTerms = __bind(this.resizeAllTerms, this);
      this.insertTerm = __bind(this.insertTerm, this);
      this.add = __bind(this.add, this);
      this.getItemsSync = __bind(this.getItemsSync, this);      this.currentDocNum = 0;
      this.documents = [];
      this.termDocs = [];
      this.emptyTermDocs = new BitArray();
    }

    Index.prototype.count = function() {
      return this.documents.length;
    };

    Index.prototype.getItemsSync = function(indexes) {
      var items,
        _this = this;
      items = [];
      indexes.forEach(function(value, index) {
        if (value) return items.push(_this.getItemSync(index));
      });
      return items;
    };

    Index.prototype.getItemSync = function(documentNumber) {
      var x;
      if (documentNumber > this.documents.length) {
        console.log(documentNumber);
        return null;
      }
      x = this.documents[documentNumber];
      if (x == null) {
        console.log("null document at index: " + documentNumber);
        return null;
      }
      return x.document;
    };

    Index.prototype.add = function(document, terms, callback) {
      var _this = this;
      return process.nextTick(function() {
        var docNum;
        docNum = _this.addSync(document, terms);
        return callback(null, _this, docNum);
      });
    };

    Index.prototype.insertTerm = function(term, documentNumber) {
      var i, termDoc, termObj;
      termObj = _createTerm(term);
      i = 0;
      while (i < this.termDocs.length && _compareTerms(termObj, this.termDocs[i].term) > 0) {
        i++;
      }
      if (i < this.termDocs.length && 0 === _compareTerms(termObj, this.termDocs[i].term)) {
        termDoc = this.termDocs[i];
      } else {
        termDoc = {
          term: termObj,
          masks: new BitArray
        };
        this.termDocs.splice(i, 0, termDoc);
      }
      return termDoc.masks.set(documentNumber, true);
    };

    Index.prototype.addSync = function(document, terms) {
      this.replaceAtSync(this.currentDocNum, document, terms);
      if (this.currentDocNum % 32 === 0) this.resizeAllTerms();
      return this.currentDocNum++;
    };

    Index.prototype.replaceAtSync = function(index, document, terms) {
      var doc, term, _i, _len, _results;
      doc = {
        document: document,
        terms: terms,
        index: index
      };
      this.documents[index] = doc;
      _results = [];
      for (_i = 0, _len = terms.length; _i < _len; _i++) {
        term = terms[_i];
        _results.push(this.insertTerm(term, index));
      }
      return _results;
    };

    Index.prototype.resizeAllTerms = function() {
      var tv, _i, _len, _ref;
      this.emptyTermDocs.set(this.currentDocNum, 0);
      _ref = this.termDocs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tv = _ref[_i];
        tv.masks.set(this.currentDocNum, tv.masks.get(this.currentDocNum));
      }
    };

    Index.prototype.getItem = function(documentNumber, callback) {
      var _this = this;
      return process.nextTick(function() {
        var result;
        result = _this.getItemSync(documentNumber);
        return callback(null, _this, result);
      });
    };

    Index.prototype.getTermsSync = function() {
      var i, terms;
      terms = [];
      i = 0;
      while (i < this.termDocs.length) {
        terms[i] = this.termDocs[i].term;
        i++;
      }
      return terms;
    };

    Index.prototype.getTerms = function(continuation) {
      var _this = this;
      return process.nextTick(function() {
        var result;
        result = _this.getTermsSync();
        return continuation(null, result);
      });
    };

    Index.prototype.getTermDocsForTermSync = function(term) {
      var i, t, termObj;
      termObj = _createTerm(term);
      i = 0;
      while (i < this.termDocs.length) {
        t = this.termDocs[i].term;
        if (termObj.term === t.term && termObj.field === t.field) {
          return this.termDocs[i];
        }
        i++;
      }
      return null;
    };

    Index.prototype.getIndexesForTermSync = function(term) {
      var termDocs;
      termDocs = this.getTermDocsForTermSync(term);
      if (termDocs == null) return this.emptyTermDocs;
      return termDocs.masks;
    };

    Index.prototype.getIndexesForTerm = function(term, continuation) {
      var _this = this;
      return process.nextTick(function() {
        var result;
        result = _this.getIndexesForTermSync(term);
        return continuation(null, result);
      });
    };

    return Index;

  })();

  module.exports = {
    Index: Index
  };

  _createTerm = function(term) {
    if ("string" === typeof term) {
      return {
        field: null,
        term: term
      };
    }
    return term;
  };

  _compareTerms = function(a, b) {
    if (a.field < b.field) return -1;
    if (a.field === b.field) {
      if (a.term < b.term) return -1;
      if (a.term === b.term) return 0;
    }
    return 1;
  };

}).call(this);
