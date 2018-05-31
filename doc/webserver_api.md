# はじめに
　弁天-coreで提供されるスマートコントラクト群を直接いじればブロックチェーン上でギャンブルを実行できるのだが、実際にはWebでのアクセス手段や過去のギャンブルの履歴検索などができないと不便で仕方がない。
　そこでこのレイヤーでは、弁天でのギャンブルのデプロイから結果の集計までをHTTPで行う。
　ETHブロックチェーンとのやりとりもするが、ふつうのRDBも併用する。
　ギャンブルの胴元のみが使えるAdminAPIと、一般顧客向けのAPIがある。

##全体共通ルールと主要な概念

* この資料の前に弁天coreのドキュメントに書いてある内容の理解が前提。
* リクエスト・レスポンスともJSONを使う。文字コードはUTF8固定。日時表記はUTC固定。
* ユーザの認証はクッキーを使う。ただし開発版は利便性のためJSONにユーザIDを直接入れて認証のかわりとしてよい。
* 金額の表記はETH単位とする。つまり10^-18の精度のdecimal値を扱えるライブラリなり言語が必要になる
* 弁天ユーザには、ウォレット管理を弁天システムに任せる「通常ユーザ」と、ウォレットはユーザ自身で管理し、そのアドレスだけを弁天システムに登録する「ウォレットユーザ」がある。
* **(重要)**ETHトランザクション発行を伴うAPIでは、署名前のraw transaction文字列を出力するところまでが機能である。ウォレットユーザの場合、それに自分で署名してETHネットへ発行する。通常ユーザの場合、署名と発行のための単一APIで発行する。Admin向けの場合、署名はコールドウォレット上で行う運用が安全である。
* 1つのBenten-Webサーバは１つの弁天Cashierと対応する。
* 賭けや結果の投票内容のエンコード・デコードはRegulationコントラクトにやらせてもいいのだが、面倒なので同等のコードをサーバ上あるいはクライアントのJavaScriptにやらせてもいい。
* DBの型名はDBMSによって若干変わる。MySQLなのかAurolaなのかMSSQLなのか現時点では未定なので。

## DBスキーマ
　カラム名idは、１から順に振るID。MySQLではAUTO INCREMENT, MSSQLではIdentity

### game_schemaテーブル
|カラム名|型|機能|
|:-----|:------|:------|
|id|||
|title|varchar(32)|ゲームの型の名称　例「サッカー」※1|
|regulation_url|varchar(128)|詳細ルールのドキュメントの場所。このドキュメントのハッシュはRegulationに埋め込まれるので改竄があれば検出できる|
|abi|blob|スキーマのABI。ゲームのデプロイや操作に必要	|
|bytecode|blob|ゲームのバイトコード本体。デプロイに必要|
|regulation_id|int|該当するレギュレーション|

* ゲームの型それぞれに１レコードが対応する。このテーブルへの書き込みはWebからはやらずDBの直接操作を基本とする。
* DBにせずサーバ上に置いたファイルとして実装する方がいいかもしれない。
* bytecodeは数百KB程度のサイズになる可能性あり。
* regulation_urlはreguration_id経由でregulationsテーブルから取ってもいいのだが、参照頻度が高いのでここにコピーを付けておく
* titleの多言語対応どうするかが未定

※１　サッカーといっても、引き分けにせずPK戦までやるものは別のゲームになるし、ホーム＆アウェイで２試合合計で決めるようなやつもある。

### gamesテーブル

|カラム名|型|機能|
|:-----|:------|:------|
|id|||
|schema_id|int|対応するゲームのスキーマ|
|title|varchar(64)|ゲームのタイトル　例「2018年スペイン１部リーグ第１節　バルセロナvsレアルマドリード」	|
|address|varchar(64)|ゲームのコントラクトアドレス|
|voting_address|varchar(64)|投票所のコントラクトアドレス|
|bet_start_time|datetime|賭けの受付開始|
|bet_end_time|datetime|終了時刻|
|vote_start_time|datetime||結果投票の受付開始|
|vote_end_time|datetime|終了時刻|
|settlement_time|datetime|払い戻し予定時刻|
|status|varchar(8)|現在状態|
|result_bet|decimal|トータルの賭け総量|
|result_voting_fee|投票フィー|
|result_owner_fee|胴元の利益|
|result_refund|払戻額|
|result_txid|varchar(64)|払い戻しトランザクションID|

　賭けの１件ごとに１レコードが作られる。２０チームのサッカーのリーグ戦なら毎節１０レコードである。
　時刻情報、結果集計情報はゲームのコントラクトアドレスをもとにブロックチェーン上に問い合わせれば同じデータを得られるが、その問い合わせを簡便にするために用意したレコードである。「現在開催中の賭け一覧」の検索とかは良くあることである。				

### usersテーブル
|カラム名|型|機能|
|:-----|:------|:------|
|id|||
|mail|varchar(256)| メールアドレス|
|password|varchar(64)|パスワード、メールアドレス、適当なsaltを連結してハッシュをとったもの|
|wallet_index|int|BIP32のウォレットインデックス　「ウォレットユーザ」の時は０|
|ext_address|varchar(64)| 外部送金用アドレス|
|cold_address0|varchar(64)| ALTアドレス|
|bet_count|int|賭けの回数|
|bet_total|decimal|トータル金額|
|refund_total|decimal|払戻金額|
|vote_count|int|正解投票の回数|
|vote_volume|decimal|正解投票の総金額|
|attributes|varchar|任意の属性を記録しておくためのメモ欄|

アドレスのみを登録しユーザ認証なしで完全匿名というタイプのユーザを許すことも考えているが、
それだと他人のETHアドレスさえ分かればギャンブル履歴がAPIで見えてしまう。
ブロックチェーンには記載されている内容なので本質的差はないがちょっと気になる。
bet_count以下は統計的情報で、アクティブユーザの抽出等で使う。
cold_addressはGettingStartedの「コールドアドレスとは」の項参照。複数個できる可能性に備えてカラム名には 0 をつけている
ext_addressは、出金時の宛先のアドレス。出金毎にも指定できるが、前回使用時のものを記憶しておく、程度の意味合い。
attributesは、そのアカウントについてのメモを任意のJSONで記録しておくためのもの。

### regulationsテーブル
|カラム名|型|機能|
|:-----|:------|:------|
|id|||
|title|varchar(256)|タイトル|
|regulation_url|varchar(256)|自然言語で書かれたドキュメントURL|
|abi|blob|コントラクトのABI|
|bytecode|blob|コントラクトのバイトコード|
|voting_abi|blob|投票所のABI|
|voting_bytecode|blob|投票所のバイトコード|
|address|varchar(64)|デプロイ済みのアドレス|

　これもgame_schema同様、サーバがローカルファイルで持っていてもいい内容
　投票所を使わずOraclizeサービスを使うオプションが追加予定

###vote_historyテーブル
Votingコントラクトに対し投票した履歴を保持する

|カラム名|型|機能|
|:-----|:------|:------|
|id|||
|user_id|int|ユーザ|
|game_id|int|ギャンブルのID|
|time|datetime|投票執行した時刻
|content|bytes|投票内容|
|volume|decimal|投票した金額|
|refund|decimal|払い戻し金額|

「周知の結果を入力するだけで報酬が貰えます」というのを宣伝ツールにしたいので、アカウント作成の手間を省きできるだけで簡単な手続きで素人が投票できるようにしたい。

###bet_historyテーブル
賭けの履歴を保持する

|カラム名|型|機能|
|:-----|:------|:------|
|id|||
|user_id|int|ユーザ|
|type|varchar(8)|レコードタイプ|
|game_id|int|ギャンブルのID|
|time|datetime|賭けを執行した時刻
|content|bytes|賭けた内容|
|volume|decimal|賭けた金額|
|refund|decimal|払い戻し金額|

このテーブルは先物タイプのギャンブルの機能追加に伴いいくらか変更予定。特に、結果を待たずに版単売買で決済するのが大きな要素
コインの購入と払い戻しの記録も兼ねる。

## AdminAPI
 以下からがAPIの説明になる。Admin用途User用があるが、一部機能は重複している。
 弁天coreとは異なり、CashierとGameは運営者が同一という前提にしている。今後分岐する可能性はある。
 JSONのキーの""は省略。
　API名称は、実際には https://benten.com/api/AdminLogin みたいなURLに対してコールすることになる。

#### AdminLogin

    [入力] {password:<password>}

 * パスワードを認証し、成功したらCookieを付加する

#### CreateUser
    [入力] {mail:<mail>, ext_address:<外部ETHアドレス>, password:<password>, }

 * ユーザアカウントを作る機能
 * ext_address指定時はウォレットユーザ、省略時は通常ユーザ
 * メールはウォレットユーザでは省略可
 * 通常ユーザの場合、他と衝突しないBIP32のWallet Indexを計算してuserレコードに付与
 * メールアドレスの他アカウントとの重複は許さない
 * そのアドレスにメールを送り、メールに記載のURLをアクセスした時点で作成完了（そうするまではDBを汚さない）動作であること。
 * これは認証なしで作成可能


#### DeployGame
    [入力] { game_schema:<game_schema_id>, title:<game_title>, voting_fee:<voting_fee> }
    [出力] { game_id:<new_game_id> }

 * 投票所とゲーム本体をデプロイ
 * まずgame_schema_idをもとにDBを見てregulation_idを獲得。そこから投票所のバイトコードとABIを得る。
 * 投票所をETHネットにデプロイし、そのアドレスを使ってGameもデプロイ。結果のコントラクトアドレス等をDBに記録。
 * voting_fee分のコインをセットアップ

#### CloseVoting
    [入力] { game_id:<game_id> }

* 結果投票を締め切る
* 投票所のコントラクトに対し締め切りのメソッドをコール
* 結果を取得し、多数決で決まった正解をDBに書き込む
* 投票と払い戻しの状況を投票所コントラクトから取得し、vote_historyテーブルに書き込む。userテーブルにも統計情報を書き込む。

#### CloseGame
    [入力] { game_id:<game_id> }

* ゲームのクローズ
* ゲームのコントラクトに対し終了のメソッドをコール
* 払い戻しの状況をゲームコントラクトから取得し、bet_historyテーブルに書き込む。userテーブルにも統計情報を書き込む。

 CloseVotingとCloseGameは一体的に呼ぶことも考えられるが、胴元が損をする可能性のあるギャンブルの場合、CloseVotingとCloseGameの間のタイミングで、Game開設者がコインを手当てするオペレーションを挟まないとゲームのクローズができないのでその関係で手順を分ける。

#### ModifyGameParameter
    [入力] { game_id:<game_id>, content:<bytes> }

* ゲーム開催中にパラメータを変更する
* スポーツの試合では、試合開始時までオッズが刻々と変化するのが普通である。そういうタイプのギャンブルではGame開設者が適宜パラメータを調節する。パラメータのエンコーディング方法はRegulationに記述する。

#### SupplyCoinFromCashier
    [入力] { game_id:<game_id>, voting_id:<voting_id>, amount:<value> }

* ゲームあるいは投票所に追加のコインを供給する。game_id, voting_idはどちらか片方のみ指定。
* 補給を受けないとゲームのクローズができない場合、悪意ある投票者により事実と異なる結果になりそうな場合、等に使うことを想定している。

#### QueryGames
    [入力] { (検索オプション) }
    [出力] [ {game_id:<game_id>, title:<title>, time:<time>　}, ... ]

* 「現在開催中」「開催予定」「投票受付中」などいろいろ条件を指定してGameを検索する。
* これはDBへ問い合わせることの組み合わせでできるはず。ブロックチェーンへのアクセスは発生しない。

## UserAPI

#### Login
    [入力] {mail:<mail>, ext_address:<eth_address>, password:<password>}

 * ユーザのログイン。mailとext_addressはどちらか片方のみあればいい。
 * 認証成功すればCookieに適当なセッションIDを付加し、その後の通信に使用

#### GetUserInfo/SetUserInfo

 * 通常ユーザは自分の統計情報を見たりパスワード変更したりができる。
 * Adminはどのユーザの情報も見れる。
 * コールドアドレスの登録機能も兼ねる。この場合はCashierに対してのごく簡単なトランザクション発行を伴う。

#### WithdrawFromCashier
    [入力] { ext_address:<eth_address> }

* 外部アドレスにコインから換金したETHを送付
* アドレスのデフォルト値はそのuserのext_addressフィールド

#### EncodeVote/DecodeVote, EncodeBet/DecodeBet

* 投票と賭けの内容を平易な表現(宝くじならくじ番号）とデプロイ用のbytesとで相互変換する
* Regulationコントラクトの'view'メソッドで実現できている内容なのでそれをそのまま呼んでもいいが、パフォーマンスに難あるようなら同等の動作をサーバ上あるいはJavaScriptライブラリとして実装。後者の場合APIはいらなくなる。

#### Vote
    [入力] { game_id:<game_id>, content:<bytes>, amount:<value> }

* 結果の投票を行う
* game_idから検索したvotingコントラクト、content、amountの３つを引数にCashierのメソッドをコール
* 投票受付の期間内かどうか、投票量の上限以下かどうか、等は事前に投票所に問い合わせて確認し、適切なエラーメッセージを返すほうが望ましい

#### Bet
    [入力] { game_id:<game_id>, content:<bytes>, amount:<value> }

* 賭けの本体
* game_idから検索したgameコントラクト、content、amountの３つを引数にCashierのメソッドをコール
* 賭けの期間内かどうか、投票量の上限以下かどうか、等は事前にGameに問い合わせて確認し、適切なエラーメッセージを返すほうが望ましい


#### QueryVoteHistory
    [入力] { start_time ,end_time}
    [出力] [ {game_id:<game_id>, title:<title>, time:<time>, content:<content>, truth:<truth>, amount:<value>, refund:<refund> }, ... ]

* 日時範囲を指定し、そのユーザの過去の投票履歴を返す
* これはDBへ問い合わせることの組み合わせでできるはず。ブロックチェーンへのアクセスは発生しない。

#### QueryBetHistory
    [入力] { start_time ,end_time}
    [出力] [ {game_id:<game_id>, title:<title>, time:<time>, content:<content>, truth:<truth>, amount:<value>, refund:<refund> }, ... ]

* 日時範囲を指定し、そのユーザの過去の賭けの履歴を返す
* これはDBへ問い合わせることの組み合わせでできるはず。ブロックチェーンへのアクセスは発生しない。


## 付録　入出金の流れ
入金の流れはユーザタイプにより異なる。

### 通常ユーザのコイン購入
* アカウント作成時にwallet_indexを割り振る
* それで生成したETHアドレスをユーザの画面に表示する。
* 他の取引所等からそのアドレスへETHを送付する。
* 弁天WebシステムはETH入金を検出するとそれをCashierに送ってそのユーザのためにコイン購入

### ウォレットユーザのコイン購入
* アカウント作成時、cold_addressとパスワードで登録
* ユーザはそのアドレスから自分でCashierに送金するとコイン購入になる
* メールアドレスも不要、ほぼ完全匿名

出金は、CashierでETHへ交換ののちext_addressへ送付。
