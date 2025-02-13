import Head from 'next/head';
import Image from 'next/image';
import dateABotOrNot from '../assets/dbn/output-2.jpg';

const {faker} = require('@faker-js/faker');
import {useState, useEffect} from 'react';
import buildspaceLogo from "../assets/buildspace-logo.png";

let gender = Math.random() < 0.5 ? 'female' : 'male',
    firstName = faker.name.firstName(gender),
    lastName = faker.name.lastName(gender)

const actBot = {
    name: firstName + ' ' + lastName
};

const _ = {
    speechSynthesis: null,
    totalText: '',
    firstTime: true,
    prompt: async (setIsGenerating, isGenerating, text, setApiOutput) => {
        setIsGenerating(true);

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userInput: text }),
        });

        const data = await response.json();
        const output = data && data.output;

        console.log("API replied...", output)

        setApiOutput(`${output}`);
        setIsGenerating(false);

        _.totalText = text + ' ' + output;
        console.log('---->totalText : ', _.totalText)
        return output;
    },

    speech: (output) => {
        const voices = speechSynthesis.getVoices();

        _.speechSynthesis = new SpeechSynthesisUtterance(output);
        if ( voices.length !== 0 && gender == 'female') {
           // _.speechSynthesis.voice = voices[0];
        }
        speechSynthesis &&    speechSynthesis.cancel()
        _.speechSynthesis.lang = 'en-US';
        speechSynthesis.speak(_.speechSynthesis);
    }
};



const Home = () => {
    const bots = [{}, {}]

    const [userInput, setUserInput] = useState('');
    const [apiOutput, setApiOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);


    const callGenerateEndpoint = async () => {
        console.log("Calling OpenAI...>", userInput);

        console.log(`API: ${userInput}`)

        const initText = _.totalText
            + '\\n Human:' + userInput
            + ' \\n DateABotOrNot:' + actBot.name + ': ';

        const output = await _.prompt(setIsGenerating, isGenerating, initText, setApiOutput);

        _.speech(output)
    };
    const onUserChangedText = (event) => {
        setUserInput(event.target.value);
    };

    useEffect(() => {
        _.firstTime && (async () => {
            _.firstTime = false;

            const initText =  'Hello, how can I help you today?';

            
            await _.prompt(setIsGenerating, isGenerating, initText, setApiOutput);

        })()
    }, []);


    return (
        <div className="root">
            <Head>
                <title>dateABotOrNot | eggman </title>
            </Head>
            <div className="container">
                <div className="header">
                    <div className="header-title">
                        <div className="badge--logo">
                            <Image src={dateABotOrNot} alt="dateABotOrNot logo"/>
                        </div>
                    </div>
                    <h1>
                        Date a Bot or Not
                    </h1>
                    <div className="header-subtitle">
                        <div className="output-header">
                            <h2>
                                get in touch with {actBot.name}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="prompt">
                    <div className="prompt__item">
                        {apiOutput && (
                            <div className="output">
                                <div className="output-content">
                                    <p dangerouslySetInnerHTML={{__html: apiOutput}}></p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="prompt__item">
                        <div className="prompt__text-container">
                            <textarea titel="talk width {actBot.name} " placeholder="&#128148;..."
                                      className="prompt-box" value={userInput}
                                      onChange={onUserChangedText}
                                      onKeyPress={(ev) => {
                                          if (ev.key === 'Enter') {
                                              callGenerateEndpoint();
                                              setUserInput('');
                                              ev.preventDefault();
                                          }
                                      }}/>
                            <i className="prompt__hint">hit enter to send send {actBot.name} ❤️</i>
                        </div>
                    </div>
                </div>
                <br/><br/><br/><br/><br/>
            </div>

            <div className="badge-container grow">
                <a
                    href="https://buildspace.so/builds/ai-writer"
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="badge">
                        <Image src={buildspaceLogo} alt="buildspace logo"/>
                        <p>thanks to buildspace for guiding</p>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default Home;