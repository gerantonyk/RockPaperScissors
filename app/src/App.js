import './App.css';
import {useEffect, useState } from 'react';
import json from "./artifacts/contracts/RockPaperScissors.sol/RockPaperScissors.json"
import { ethers } from 'ethers';
import { parseEther } from 'ethers/lib/utils';



function App() {

  const contractAddress = "0xBF01B9eC81A1a4E43A55C1B54766D7e9e8c62264";
  const contractAbi = json.abi;
  const { ethereum } = window;

  if(!ethereum) {
    alert("Hey, please download MetaMask!");
  } 
  ethereum.request({ method: 'eth_requestAccounts'});

  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const rockPaperScissors = new ethers.Contract(contractAddress, contractAbi, signer);

  const moves = [
    {value:'1',name:'Rock'},
    {value:'2',name:'Paper'},
    {value:'3',name:'Scissors'}
  ]
  const [params,setParams] = useState({password:'', move:'1'})

  async function validateChain() {
    const chain = await window.ethereum.request({ method: 'eth_chainId'});
    if (chain === '0x4') return true
    return false
  }

  async function play() {
    if (await validateChain()) {
      try{
        await rockPaperScissors.play(params.move,params.password,{value: parseEther('0.01')})
      } catch(e) {
        alert(e.error.message)
      }
    } else {
      alert("Only avaliable on Rinkeby")
    }
  }

  async function commitReveal() {
    if (await validateChain()) {
      try{
        await rockPaperScissors.commitReveal(params.move,params.password)
      } catch(e) {
        alert(e.error.message)
      }
    } else {
      alert("Only avaliable on Rinkeby")
    }
  }

  async function collectBets() {
    if (await validateChain()) {
      try{
        await rockPaperScissors.collectBets()
      } catch(e) {  
        alert(e.error.message)
      }
    } else {
      alert("Only avaliable on Rinkeby")
    }
  }

  function handlechange(e) {
    setParams({...params,[e.target.name]: e.target.value})
  }

useEffect(()=>{
  rockPaperScissors.on('GameFinished',(text,address)=>{
    if (text!=="Draw") {
      alert("Game result: "+ text)
    } else {
      alert("Game result: "+ text +' address:'+address)
    }

  })
})

  return (
    <div className="main">
      <h1> Rock Paper Scissors</h1>
      <div className= "component">
      <label className= 'tittle'>Pick your move</label>
      <div className= 'radio'>
              {moves.map((move,index)=>
                <label key={index}>
                  <input type="radio" name='move' value={move.value} checked={params.move === move.value} onChange={e=>handlechange(e)}/>
                  {move.name} 
                </label>)
              }
          </div>            
        <label className= 'tittle' htmlFor='password'>Add some salt</label>
        <input type="text" 
          id='password'
          className='mediumText'
          name="password" 
          placeholder="Your password" 
          value={params.password} 
          onChange={e=>handlechange(e)}
        />

          <input type="button" 
            className='button'
            name="boton" 
            placeholder="" 
            value="play"
            onClick={()=>play()}
          />
          <input type="button" 
            className='button'
            name="boton" 
            placeholder="" 
            value="Reveal"
            onClick={()=>commitReveal()}
          />
          <input type="button" 
            className='button'
            name="boton" 
            placeholder="" 
            value="Collect Bets"
            onClick={()=>collectBets()}
          />
        </div>
    </div>
  );
}

export default App;
