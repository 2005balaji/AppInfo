import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Androidrobot from "../Images/androidrobot.gif";
import "./Uploadbox.css";
import { VscCloudUpload } from "react-icons/vsc";
import { useDropzone } from "react-dropzone";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthenticator } from "@aws-amplify/ui-react-core";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // ES Modules imort
import { LoadingText } from "../composables";

const key = import.meta.env.VITE_S3_ACCESSID as string;
const secret = import.meta.env.VITE_S3_SECRETKEY as string;
const bucket = import.meta.env.VITE_S3_BUCKET_NAME as string;

const client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: key,
    secretAccessKey: secret,
  },
});

function Core(props: { user: { userId: string } }) {
  const notify = () =>
    toast.error("Only APK files are allowed", {
      position: "bottom-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      progress: 1,
      theme: "light",
    });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [loading, setLoading] = useState(false); // Add loading state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    try {
      setLoading(true);

      const path = `${props.user.userId}/${Date.now()}-${file.name}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: file,
        ContentType: file.type,
        Metadata: {
          "x-amz-meta-userid": props.user.userId,
          "x-amz-meta-filename": file.name,
          "x-amz-meta-filetype": file.type,
        },
        BucketKeyEnabled: true,
      });

      await client.send(command);

      navigate("/details/" + path);

      return;
    } catch (err) {
      console.log(err);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    let filetype;
    acceptedFiles.forEach((file) => {
      filetype = file.type;
    });

    if (filetype != "application/vnd.android.package-archive") {
      notify();
    } else {
      handleFileSelect(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "apk/file": [".apk"],
    },
  });

  return (
    <>
      {loading ? (
        <div id="loader1">
          <img src={Androidrobot} id="androidbot" alt="" />
          <p id="analyzing">
            Uploading your file<span className="loader__dot">.</span>
            <span className="loader__dot">..</span>
          </p>
        </div>
      ) : (
        <div className="uploadwindow">
          <p className="labeltxt">
            Get the inside scoop on all your favourite Android apps!
          </p>

          <div className="dnd-container" {...getRootProps()}>
            <div className="dnd">
              <VscCloudUpload id="cloudlogo" />
              <p id="minilabel">Drag & drop to upload</p>
              <label>
                <input {...getInputProps()} />
                <p id="dndbutton">or browse</p>
              </label>

              <p id="format">.apk format only</p>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-center"
        autoClose={false}
        limit={2}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        theme="light"
      />
    </>
  );
}

function Uploadbox() {
  const { authStatus, user } = useAuthenticator((context) => [context.user]);

  return (
    <div>
      {authStatus === "authenticated" ? (
        <Core user={{ userId: user?.username }} />
      ) : (
        <LoadingText text={"Kindly wait while we authenticate you"} />
      )}
    </div>
  );
}

export default Uploadbox;
