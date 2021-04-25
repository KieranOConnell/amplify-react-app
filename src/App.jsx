import logo from './logo.svg';
import './App.css';
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';
import { AmplifySignOut, withAuthenticator } from '@aws-amplify/ui-react';
import { listImages } from './graphql/queries';
import { updateImage, createImage } from './graphql/mutations';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid'
import { Paper, IconButton, Tooltip, Fab, TextField, Input } from '@material-ui/core';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import AddIcon from '@material-ui/icons/Add';
import PublishIcon from '@material-ui/icons/Publish';

Amplify.configure(awsconfig);

function App() {
  const [images, setImages] = useState([]);
  const [imageOpened, setImageOpened] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [showAddImage, setShowAddImage] = useState(false);

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

  const openImage = async (idx) => {
    const imageFilePath = images[idx].filePath;

    if (imageOpened === idx) {
      setImageOpened("");
      return;
    }

    try {
      const imageAccessURL = await Storage.get(imageFilePath, { expires: 60 });
      setImageOpened(idx);
      setImageURL(imageAccessURL);
      return;
    } catch (error) {
      console.log("Opening Image Error", error);
      setImageURL("");
      setImageOpened("");
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
        <div className="addImage">
          {
            showAddImage ? (
              <AddImage onUpload={() => {
                setShowAddImage(false)
                fetchImages()
              }} />
            ) : (
              <Tooltip title="Upload">
                <Fab onClick={() => setShowAddImage(true)}> 
                  <AddIcon /> 
                </Fab>
              </Tooltip>
          )}
        </div>
        <div className="imageList">
          { images.sort((a, b) => b.likes - a.likes).map((image, idx) => {
              return (
                <Paper variant="outlined" elevation={2} key={`image${idx}`}>
                  <div className="imageCard">
                    <div>
                      <Tooltip title={ imageOpened === idx ? "Close" : "Open"}>
                        <Fab aria-label="open" onClick={() => openImage(idx)}>
                          { imageOpened === idx ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon /> }
                        </Fab>
                      </Tooltip>
                    </div>
                    <div>
                      <div className="imageLocation">{image.location}</div>
                      <div className="imagePhotographer">{image.photographer}</div>
                    </div>
                    <div>
                    <Tooltip title="Like">
                      <IconButton aria-label="like" onClick={() => likeImage(idx)}>
                        <ThumbUpIcon style={{ color: "#5294ff" }} />
                      </IconButton>
                    </Tooltip>
                      {image.likes}
                    </div>
                  </div>
                  {
                    imageOpened === idx ? (
                      <div className="imageContainer">
                        <img src={imageURL} className="imageDisplay" alt={image.location}/>
                      </div>
                    ) : null
                  }
                </Paper>
              )
          })}
        </div>
      </section>
    </div>
  );
}

export default withAuthenticator(App);

const AddImage = ({onUpload}) => {
  const [imageData, setImageData] = useState({});
  const [fileData, setFileData] = useState();

  const uploadImage = async () => {
    if (typeof fileData !== "undefined") {
      const { location, photographer } = imageData;
      const fileExtension = fileData.name.split(".").pop();
      const { key } = await Storage.put(`${uuid()}.${fileExtension}`, fileData);

      const createImageInput = {
        id: uuid(),
        location,
        photographer,
        filePath: key,
        likes: 0
      }

      await API.graphql(graphqlOperation(createImage, { input: createImageInput }))
    }
    onUpload();
  };

  return (
    <div className="newImage">
      <TextField label="Location" value={imageData.location} onChange={e => setImageData({...imageData, location: e.target.value})} />
      <TextField label="Photographer" value={imageData.photographer} onChange={e => setImageData({...imageData, photographer: e.target.value})} />
      <Input type="file" inputProps={{ accept: "image/*" }} onChange={e => setFileData(e.target.files[0])} />
      <Tooltip title="Publish">
        <Fab onClick={uploadImage}>
          <PublishIcon />
        </Fab>
      </Tooltip>
    </div>
  )
};
