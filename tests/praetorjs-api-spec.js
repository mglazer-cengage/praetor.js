// specs code
describe("Praetor", function() {
  var booksString = '{"books":[{"title":"kids", "author":"adams"},{"title":"action", "author":"johns"}]}';
  var books = JSON.parse(booksString);
  p.setDataStore('books', books);

  describe('p() unique id instances', function() {
    it("can set & get a unique instance of datastore", function() {
      p.setDataStore('test', {}, 'id')
      expect(p.getDataStore('test', 'id')).toEqual({});
      expect(p.getDataStore('test', 'id2')).toEqual(undefined);
      p.setDataStore('test2', {}, 'id2')
      expect(p.getDataStore('test2', 'id2')).toEqual({});
      expect(p.getDataStore('test2', 'id')).toEqual(undefined);
    });
  });

  it("can set & get a data store", function() {
    expect(p.getDataStore('books')).toEqual(books);
  });

  it("can set & get a JSON path query", function() {
    p.setJsonQuery('getBookTitles', '$..title', 'books');
    expect(p.getJsonQueryResult('getBookTitles')).toEqual(['kids', 'action'])
  });

  it("can set & get the entire state", function() {
    expect(p.getState()).toEqual({
      stores: {
        books: books
      },
      queries: {
        getBookTitles: {
          query: '$..title',
          store: 'books'
        }
      },
      procs: {}
    });
  });

  it("can set & get a stored procedure with return", function() {

    var code = '\
       if(this.params.upperCase){ \
            this.results[0]["getBookTitles"]=this.results[0]["getBookTitles"]. \
            map(function(x) { \
              return x.toUpperCase(); \
            }); \
        } \
        return this.results \
        ';

    p.setStoredProc('convertBookTitles', ['getBookTitles'], code, {
      upperCase: false
    })
    var results = p.getStoredProcResult('convertBookTitles', {
      upperCase: true
    });

    expect(results[0]['getBookTitles']).toEqual(["KIDS", "ACTION"]);
  });

  it("can set & get a stored procedure with NO return", function() {

    var code = '\
       if(this.params.upperCase){ \
            this.results[0]["getBookTitles"]=this.results[0]["getBookTitles"]. \
            map(function(x) { \
              return x.toUpperCase(); \
            }); \
        } \
        ';

    p.setStoredProc('convertBookTitles', ['getBookTitles'], code, {
      upperCase: false
    })
    var results = p.getStoredProcResult('convertBookTitles', {
      upperCase: true
    });
    expect(results[0]['getBookTitles']).toEqual(["KIDS", "ACTION"]);
  });
});
