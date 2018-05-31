# Benten Project

THIS PROJECT IS UNDER EARLY DEVELOPMENT STATUS.
We are goint to publish officially in August or September 2018. 

 Benten Project is a platform that aims fair and low cost predictive market management including gambling with smart contract.
block chain is an innovative technology and the first famous application proved that currency issuing and distribution can be done fairly by means of democratic means without government power. That is what we call Bitcoin.

 In the past it was common sense that the administration should be responsible for services that require high levels of fairness. Block chain is a technology that can replace a part of it, and we started the Benten project as one of its rudimentary experiments.

 With Benten, everyone can hold and participate gambling on block chains regardless of any nationality or region.
Gambling is targeting all events that are currently uncertain but will be fixed at some point in the future. As a result of public gambling, professional sports games, elections, events occurring in financial markets, etc.

 As the directionality is close to the "predicted market" handled in projects such as augur and gnosis, while the predictive market focuses on price finding function of the market, the Benten project purely gambles low cost I am focusing on having fun with it.

 Originally, gambling is a lot of fun if you participate with moderation, but gambling can not be done in many countries unless it is strictly regulated by the government. To separate this wonderful entertainment of gambling from under the control of the government and to guide it to the world based on the values ​​of freedom and democracy as if bit coin showed the possibility of separating currency issue right from the government I am aiming for.


# How to build

    npm install -g truffle
    npm run compile

 Then you will get solidity files in `contracts` directory and JSON files in `build` directory as the output of truffle compilation.

# How to test

## test benten tools with mocha

    npm run mochatest

## test contracts in with ethereum client ( we recommend Ganache )

    (at first you have to start ethereum client and configure host and port in truffle.js)
    npm run soltest [test file]

 Test files are located in test directory.



