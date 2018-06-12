# 弁天用プリプロセッサ

　弁天プロジェクトでは、C言語に近いプリプロセッサを独自に用意しています。
　プリプロセッサにかける前のソースファイルは`solp`拡張子がついており、プリプロセッサの出力として通常の`sol`ファイルが得られます。

# 機能

## (1) デバッグサポート

　Solidityでは、トランザクションがrevertされるとすべてが無効になります。ですがこの挙動は開発時には不便が多く、

 * 意図せずrevertされているときその理由の追跡が難しい
 * UnitTestで、revertされるべきケースをテストしていても、本当に狙いどおりの理由でrevertされているかの確認が難しい

　といった問題があります。

　そこで、次のようなマクロを使います。

    if(acc.coin < coin)
        ERROR_CASE("coin is insufficient")

　ERROR_CASEは、C言語での次と等価な意味を持ちます。

    #if DEBUG
    #define ERROR_CASE(msg) { lastErrorMessage = msg; return; }
    #else
    #define ERROR_CASE(msg) revert;
    #endif

　こうすることで、

 * デバッグビルドでは、エラーメッセージを記憶したうえでトランザクションとしては成功させる
 * リリースビルドでは、単にrevertする

　と動作を分岐できます。

　solidity開発では、このエラーメッセージを活用してsolidityコードのバグ追跡が容易になります。

　もうひとつあります。スマートコントラクトでは、現在時刻がいつかによって処理を変えたいことがありますが、これも開発時には現在時刻が自在に設定できないと不便です。
　そこで、

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

　というようなものがあると便利です。デバッグ時には時刻を自在に指定でき、リリース時には本物の組み込み変数 `now` を使う、ということです。


## (2) typedef相当

　solidityでは、１次元のbyte配列には`bytes`が使えます。これは可変長です。
　しかし２次元になると、一応 `bytes[]` が使えますが、これはストレージにしか取れませんし、関数の引数や戻り値になれないので不便です。

　一方、`bytes8[]` や `bytes16[]` はメモリ上にもとれるので便利なのでこちらを使いたいですが、`bytes8`と`bytes16`のどちらが適切なサイズなのかは後から変えたくなるかもしれないので、一括で指定できたほうが便利です。
　そこでプリプロセッサで

    #define MY_TYPE bytes8

    MY_TYPE private _value;

　のようにできると便利です。

　弁天プリプロセッサにはこの機能があります。

## (3)  [#] と [##]

　この型定義に関連して、１つのsolpファイルから、型の内容で分岐して異なるsolファイルにしたいこともあります。
　その場合、C言語のトークン連結や文字列化のマクロに類する機能があると便利です。

　そこでプリプロセッサは次のような記法を許可しています。

    import "./BettingTarget_V#RESULT_SIZE.sol";

    contract ResultAnnouncement_R ##RESULT_SIZE	is BettingTarget_V ##RESULT_SIZE {

　RESULT_SIZEはプリプロセッサで事前に定義された定数です。

 * #に続く定数はそのまま定数の内容に置換されます。(文字列中であっても、です）
 * ##に続く定数は定数の内容に置換され、さらに前後の「スペースからなるトークン」が除去されて前後と連結されます。

　この例では、`#define RESULT_SIZE 8` であれば、

    import "./BettingTarget_V8.sol";

    contract ResultAnnouncement_R8	is BettingTarget_V8 {

　となります。

# プリプロセッサの実装

　本当は、C言語と完全互換のプリプロセッサ実装がnode.js上にあればよかったのですが、どうやら見当たらないので正規表現を使った類似機能のプロジェクトをベースに改造して使っています。もし、JavaScriptによる完全なCのプリプロセッサ実装があれば紹介してください！

