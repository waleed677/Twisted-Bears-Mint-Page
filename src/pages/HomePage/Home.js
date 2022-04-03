import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "../../redux/blockchain/blockchainActions";
import { connectWallet } from "../../redux/blockchain/blockchainActions";
import { fetchData } from "./../../redux/data/dataActions";
import { StyledRoundButton } from "./../../components/styles/styledRoundButton.styled";
import * as s from "./../../styles/globalStyles";
import Navbar from "../../components/Navbar/Navbar";
import HeroSection from "../../components/HeroSection/HeroSection";
import Social from "../../components/SocialMedia/Social";
import Video from "../../components/Video/Video";
import axios from 'axios';

const { createAlchemyWeb3, ethers } = require("@alch/alchemy-web3");
var Web3 = require('web3');
var Contract = require('web3-eth-contract');

function Home() {
  let cost = 0;
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [mintDone, setMintDone] = useState(false);
  const [supply, setTotalSupply] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [mintAmount, setMintAmount] = useState(1);
  const [displayCost, setDisplayCost] = useState(cost);
  const [state, setState] = useState(-1);
  const [canMintWL, setCanMintWL] = useState(false);
  const [disable, setDisable] = useState(false);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = () => {
    let cost = 0;
    if (state == 1) {
      cost = CONFIG.WEI_COST_WL;
    } else {
      cost = CONFIG.WEI_COST_PU;
    }

    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}`);
    setClaimingNft(true);
    setDisable(true);
    blockchain.smartContract.methods
      .mint(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        setMintDone(true);
        setFeedback(`Complete , Welcome to the Twisted Family!`);
        setClaimingNft(false);
        blockchain.smartContract.methods
          .totalSupply()
          .call()
          .then((res) => {
            setTotalSupply(res);
          });

        dispatch(fetchData(blockchain.account));
      });
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }

    if(state == 0 || state == -1 ){
      setDisplayCost(0.00);
    }
    else if (state == 1) {
      setDisplayCost(
        parseFloat(CONFIG.DISPLAY_COST_WL * newMintAmount).toFixed(3)
      );
    } else {
      setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_PU * newMintAmount).toFixed(3));
    }

    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > 2) {
      newMintAmount = 2;
    }
    setMintAmount(newMintAmount);
  };

  const maxNfts = () => {
    if(state == 0 || state == -1 ){
      setDisplayCost(0.00);
    }
    else if (state == 1) {
      setMintAmount(CONFIG.MAX_LIMIT);
      setDisplayCost(
        parseFloat(CONFIG.DISPLAY_COST_WL * CONFIG.MAX_LIMIT).toFixed(3)
      );
    } else {
      setMintAmount(CONFIG.MAX_LIMIT);
      setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_PU * CONFIG.MAX_LIMIT).toFixed(3));
    }
  };



  const getDataWithoutWallet = async () => {
    const web3 = createAlchemyWeb3("https://eth-mainnet.alchemyapi.io/v2/EDLW4rQqMI3LEJUWifxT04jTycowEQNU");
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const abi = await abiResponse.json();
    var contract = new Contract(abi, '0xB1B75818b813af1Ad69e8827533aE3bFFC81f137');
    contract.setProvider(web3.currentProvider);
    console.log(contract);
    const totalSupply = await contract.methods
      .totalSupply()
      .call();
    setTotalSupply(totalSupply);

  }

  const getData = async () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
      let currentState = await blockchain.smartContract.methods
        .currentState()
        .call();
      console.log({ currentState });
      setState(currentState);

      if (currentState == 0) {
        setDisplayCost(0.00);
        setDisable(true);
        setFeedback("Minting is not live yet!")
      } else if (currentState == 1) {
        let mintWL = await blockchain.smartContract.methods
          .isWhitelisted(blockchain.account)
          .call();
        console.log({ mintWL });
        setCanMintWL(mintWL);
        (mintWL) ? setFeedback("You are on the Whitelist!") : setFeedback(`This wallet is not on the Whitelist`);
        (mintWL) ? setDisable(false) : setDisable(true);

        setDisplayCost(CONFIG.DISPLAY_COST_WL);
      } else {
        setDisplayCost(CONFIG.DISPLAY_COST_PU);
      }
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
    getDataWithoutWallet();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <>

      <s.Body>
        <Video />
        <Navbar />
        <s.FlexContainer
          jc={"space-evenly"}
          ai={"center"}
          fd={"row"}
          mt={"25vh"}
        >
          <s.Mint>
            <s.TextTitle size={6.0} style={{ letterSpacing: "3px" }}>
              MINT NOW
            </s.TextTitle>
            <s.SpacerSmall />
            <s.TextSubTitle size={1.4}>
              {5555 - supply} of 5555 NFT's Available
            </s.TextSubTitle>
            <s.SpacerLarge />
            <s.SpacerLarge />

            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>
              <s.TextTitle>Amount</s.TextTitle>

              <s.AmountContainer ai={"center"} jc={"center"} fd={"row"}>
                <StyledRoundButton
                  style={{ lineHeight: 0.4 }}
                  disabled={claimingNft ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    decrementMintAmount();
                  }}
                >
                  -
                </StyledRoundButton>
                <s.SpacerMedium />
                <s.TextDescription color={"var(--primary)"} size={"2.5rem"}>
                  {mintAmount}
                </s.TextDescription>
                <s.SpacerMedium />
                <StyledRoundButton
                  disabled={claimingNft ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    incrementMintAmount();
                  }}
                >
                  +
                </StyledRoundButton>
              </s.AmountContainer>

              <s.maxButton
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  maxNfts();
                }}
              >
                Max
              </s.maxButton>
            </s.FlexContainer>

            <s.SpacerSmall />
            <s.Line />
            <s.SpacerLarge />
            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>
              <s.TextTitle>Total</s.TextTitle>
              <s.TextTitle color={"var(--primary)"}>{displayCost}</s.TextTitle>
            </s.FlexContainer>
            <s.SpacerSmall />
            <s.Line />
            <s.SpacerSmall />
            <s.SpacerLarge />

            {blockchain.account !== "" && blockchain.smartContract !== null && blockchain.errorMsg === ""
              && canMintWL === true && state == 1 || state == 2 
              ? (
                <s.Container ai={"center"} jc={"center"} fd={"row"}>
                  <s.connectButton
                    disabled={disable}
                    onClick={(e) => {
                      e.preventDefault();
                      claimNFTs();
                      getData();
                    }}
                  >
                    {" "}
                    {claimingNft ? "Please Confirm the Transaction in Your Wallet" : "Mint"}{" "}
                    {mintDone ? feedback : ""}{" "}
                  </s.connectButton>{" "}
                </s.Container>
              ) : (
                <>
                  {/* {blockchain.errorMsg === "" ? ( */}
                  <s.connectButton
                    style={{
                      textAlign: "center",
                      color: "var(--primary-text)",
                      cursor: "pointer",
                    }}
                    disabled={state == 0 ? 1 : 0}
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(connectWallet());
                      getData();
                    }}
                  >
                    Connect Your Wallet
                  </s.connectButton>
                  {/* ) : ("")} */}
                </>

              )}


            <s.SpacerLarge />
            {blockchain.errorMsg !== "" ? (
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "var(primary-text)",
                  cursor: "pointer",
                }}
              >
                {blockchain.errorMsg}
              </s.connectButton>
            ) : (
              ""

            )}

            {(state !== -1) && (state == 0) ? (
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "var(--primary-text)",
                  cursor: "pointer",
                }}
              >
                {feedback}
              </s.connectButton>
            ) : (
              ""

            )}

            {(canMintWL !== true) && (state == 1) ? (
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "var(--primary-text)",
                  cursor: "pointer",
                }}
              >
                {feedback}
              </s.connectButton>
            ) : (
              ""
              
              // <s.connectButton
              //   style={{
              //     textAlign: "center",
              //     color: "var(--primary-text)",
              //     cursor: "pointer",
              //   }}
              // >
              //   Public Minting is Live!
              // </s.connectButton>

            )}



            <Social />
          </s.Mint>
        </s.FlexContainer>
        <s.SpacerLarge />
        {/* <s.TextTitle size={3} color={"white"}>
          MINTING 3RD APRIL 2022
          <br />
          10AM EST
        </s.TextTitle> */}
      </s.Body>

    </>
  );
}

export default Home;
