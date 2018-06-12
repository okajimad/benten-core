# Preprocessor for Benten

  In the Benten project, We prepare a preprocessor close to C language.
  The source file before being applied to the preprocessor has a `solp` extension, and the usual `sol` file is obtained as the output of the preprocessor.

# Features

## (1) Debug support

  In Solidity, every changes becomes invalid when the transaction is reverted. However, this behavior is inconvenient during development.

 * It is difficult to track the reason when it is inadvertently reverted.
 * Even if we tested the case to be reverted in unit test, it is difficult to confirm that it is really being reverted for the aimed purpose.


Therefore, we use the following macro like C.

    if(acc.coin < coin)
        ERROR_CASE("coin is insufficient")

  ERROR_CASE has the following meaning in C language

    #if DEBUG
    #define ERROR_CASE(msg) { lastErrorMessage = msg; return; }
    #else
    #define ERROR_CASE(msg) revert;
    #endif

  By doing so, you can branch the action as follows.

 * In the debug build, store the error message and let it succeed as the transaction.
 * In release build, just revert.


  In solidity development, this error message can be used to facilitate bug tracking of solidity code.

  There is another advantage. Smart contracts sometimes want to change processing depending on when the current time is sometime, but this is also inconvenient if you can not set the current time freely at development time.

    #if DEBUG
        uint internal _now;
        function setNow(uint t) public onlyOwner {
          _now =t;
        }
        function getNow() public view returns(uint) {
          return _now;
        }
    #else
       function getNow() public view returns(uint) {
          return now;
       }
    #endif

  It is convenient to have something like this. For debugging, you can specify the time freely, and use the real embedded variable `now` at release.


## (2) typedef

  In solidity, `bytes` can be used for one-dimensional byte array. This is variable length.
  However, once in 2 dimensions, you can use `bytes[]` for the time being, but this can only be taken for smart contract storage, it is inconvenient because it can not be a function argument or return value.

  On the other hand, `bytes8[]` and `bytes16[]` are convenient because they can also be put in memory, so We'd like to use it, but you may want to change the size of `bytes8` or` bytes16` It may be convenient to be able to specify all at once because it may not be possible.

  Then, the preprocessor resolves this problem.

    #define MY_TYPE bytes8

    MY_TYPE private _value;


## (3)  [#] と [##]

  In relation to this type definition, from one `solp` file, we may want to branch on the contents of the type and make it a different sol file.

  In that case, it is useful to have a function similar to the C language token concatenation and stringinize macros.
  Therefore, the preprocessor allows the following notation.


    import "./BettingTarget_V#RESULT_SIZE.sol";

    contract ResultAnnouncement_R ##RESULT_SIZE	is BettingTarget_V ##RESULT_SIZE {

  RESULT_SIZE is a predefined constant in the preprocessor.

 * Constants following `#` are substituted as they are with the contents of the constant. (Even in the character string)
 * The constants following `##` are replaced by the contents of the constant, and the "tokens made up of spaces" before and after are eliminated and concatenated with the front and the back.

  In this sample, if we have `#define RESULT_SIZE 8`, we will get

    import "./BettingTarget_V8.sol";

    contract ResultAnnouncement_R8	is BettingTarget_V8 {


# Implementation of preprocessor

  Actually, it would have been sufficient if there was a preprocessor implementation that is fully compatible with C language in node.js envrionemnt, but since I can not find it, I am remodeling it based on a similar function project using regular expressions. If you have a complete C preprocessor implementation with JavaScript please introduce it!
