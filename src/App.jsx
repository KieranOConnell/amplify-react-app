import logo from './logo.svg';
import './App.css';
import Amplify, { API, graphqlOperation } from 'aws-amplify';
import awsconfig from './aws-exports';
import { AmplifySignOut, withAuthenticator } from '@aws-amplify/ui-react';
import { listImages } from './graphql/queries';
import { updateImage } from './graphql/mutations';
import { useEffect, useState } from 'react';
import { Paper, IconButton } from '@material-ui/core';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';

Amplify.configure(awsconfig);

function App() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
        const imageData = await API.graphql(graphqlOperation(listImages));
        const imageList = imageData.data.listImages.items;
        setImages(imageList);
    } catch (error) {
        console.log("Fetching Images Error", error);
    }
  };

  const likeImage = async (idx) => {
    try {
        const image = images[idx];
        image.likes = image.likes + 1;
        delete image.createdAt;
        delete image.updatedAt;

        const imageData = await API.graphql(graphqlOperation(updateImage, {input: image}));
        const imageList = [...images];
        imageList[idx] = imageData.data.updateImage;
        setImages(imageList);
    } catch (error) {
        console.log("Liking Image Error", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="pageTitle">
          <h1>Photo Gallery</h1>
          <img src={logo} className="App-logo" alt="logo" />
        </div>
        <AmplifySignOut />
      </header>
      <section>
        <div className="imageList">
          { images.map((image, idx) => {
              return (
                <Paper variant="outlined" elevation={2} key={`image${idx}`}>
                  <div className="imageCard">
                    <IconButton aria-label="open">
                      <KeyboardArrowRightIcon />
                    </IconButton>
                    <div>
                      <div className="imageLocation">{image.location}</div>
                      <div className="imagePhotographer">{image.photographer}</div>
                    </div>
                    <div>
                      <IconButton aria-label="like" onClick={() => likeImage(idx)}>
                        <ThumbUpIcon />
                      </IconButton>
                      {image.likes}
                    </div>
                  </div>
                </Paper>
              )
          })}
        </div>
      </section>
    </div>
  );
}

export default withAuthenticator(App);
