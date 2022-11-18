import { TrashIcon, ArrowUpTrayIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline"
import React, { useState, useCallback, FormEvent } from "react"
import { FileRejection, useDropzone, FileError, Accept } from "react-dropzone"
import { Link } from "react-router-dom"
import { formatBytes } from "../../../formats/bytes"
import api from "../../../apis/verifierApi"
import { classNames } from "../../../utils/strings"
import { SourceTabProps } from "./SourceTab"
import { errMsg } from "../../../utils/errors"
import { Warning } from "../../commons/Alert"
import { PageLoading } from "../../loading/Loading"

interface SubmitHandlerProps {
  event: FormEvent<HTMLFormElement>
  file: File
}

function UploadForm ({
  onSubmit,
  actionName,
  accept,
  children
} :{
  onSubmit: (props: SubmitHandlerProps) => void,
  actionName: string,
  accept: Accept,
  children?: React.ReactElement
}) {
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const [file, setFile] = useState<File>()
  const [fileRejection, setFileRejection] = useState<FileRejection>()

  function removeFileToUpload () {
    setFile(undefined)
    setSubmitDisabled(true)
  }

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    if (rejections !== undefined && rejections.length > 0) {
      setFileRejection(rejections[0])
      setFile(undefined)
      setSubmitDisabled(true)
    }
  }, [])

  const onDropAccepted = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles !== undefined && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setFileRejection(undefined)
      setSubmitDisabled(false)
    }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDropAccepted,
    onDropRejected,
    maxFiles: 1,
    accept
  })

  return (
    <form className="w-full flex flex-col"
      onSubmit={event => {
        event.preventDefault()
        if (file) {
          onSubmit({ event, file })
        }
        // TODO handle file undef
      }}>

      {children}

      { file
        ? <div className="flex flex-col gap-6 my-2 w-48 rounded border">
          <div className="flex gap-2 my-3 mx-3 text-sm">
            <DocumentArrowUpIcon className="w-5 h-5"/>
            <span className="break-all">{file.name}</span>
          </div>
          <div className="flex my-1 gap-2 justify-between items-end text-xs">
            <div className="mx-3">{formatBytes(file.size)}</div>
            <button type="button"
              className="mx-1 rounded p-1 hover:bg-neutral-200"
              onClick={removeFileToUpload}
            >
              <TrashIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
        : <div {...getRootProps()}>
          <input {...getInputProps()} />
          <div className="flex flex-col w-full justify-center items-center p-4 my-2 h-60
                          rounded border-2 border-dashed border-gray-200 text-gray-500 cursor-pointer">
            <ArrowUpTrayIcon className="h-7 w-7"/>
            <span>Click to select or drag and drop to upload file</span>
          </div>
        </div>
      }

      { fileRejection &&
  <div className="flex justify-between items-center">
    <div className="flex flex-col gap-2 text-sm text-red-800">
      <span>{fileRejection.file.name} cannot be uploaded</span>
      {fileRejection.errors.map((error : FileError) => {
        const key = `${fileRejection.file.name}-${error.code}`
        return (<span key={key}>{error.message}</span>)
      })}
    </div>
  </div>
      }

      <button type="submit"
        disabled={submitDisabled}
        className="py-2 my-2 border rounded border-emerald-600 bg-emerald-600 text-white font-semibold disabled:bg-emerald-200 disabled:border-emerald-200"
      >
        {actionName}
      </button>
    </form>
  )
}

function UploadSignedMetadata (
  { codeHash, dispatch, chain } : SourceTabProps
) {
  const [errorMsg, setErrorMsg] = useState()
  const [loading, setLoading] = useState(false)

  async function onSubmit ({ event, file } : SubmitHandlerProps) {
    const targetForm = event.target as HTMLFormElement

    setLoading(true)

    const formData = new FormData()
    formData.append("signature", (targetForm[0] as HTMLInputElement).value)
    formData.append("file", file)

    try {
      const res = await api.uploadMetadata({ chain, codeHash }, formData)
      if (res.ok) {
        setTimeout(() => dispatch({ type: "uploaded" }), 500)
      } else {
        const errorJson = await res.json()
        console.log(errorJson)
        targetForm.reset()
        setErrorMsg(errorJson.message)
        setLoading(false)
      }
    } catch (error) {
      dispatch({
        type: "networkError",
        error: errMsg(error)
      })
    }
  }

  return (<div className="flex flex-col p-2 m-4">
    <div className="text-gray-900 font-semibold">Upload Signed Metadata</div>
    <div className="text-gray-900 text-sm my-2">
      Metadata explainer here
    </div>
    <div className="mt-3">
      {errorMsg && <Warning
        title="Error"
        message={errorMsg}
      />}
      {loading
        ? <PageLoading loading={loading} />
        : <UploadForm
          actionName="Upload Metadata"
          onSubmit={onSubmit}
          accept={{
            "application/json": [],
            "text/plain": []
          }}
        >
          <div className="flex flex-col">
            <label htmlFor="sig">Owner Signature</label>
            <input
              id="sig"
              type="text"
              name="signature"
              className="py-2 px-3 border rounded"
              placeholder="Signature of 'sha256(metadata.json) | code hash'"
              required
            >
            </input>
          </div>
        </UploadForm>
      }
    </div>
  </div>
  )
}

function UploadVerifiablePackage (
  { codeHash, dispatch, chain } : SourceTabProps
) {
  function uploadFileToVerifier ({ file } : SubmitHandlerProps) {
    dispatch({ type: "uploading" })

    const formData = new FormData()
    formData.append("File", file)

    api.verify({ chain, codeHash }, formData)
      .then(response => response.json())
      .then(_ => {
        setTimeout(() => dispatch({ type: "uploaded" }), 10)
      })
      .catch(error => {
        dispatch({ type: "networkError", error })
      })
  }

  return (
    <div className="flex flex-col p-2 m-4">
      <div className="text-gray-900 font-semibold">Upload Source Files for Verification</div>
      <div className="text-gray-900 text-sm my-2">
        We will add simple instructions on source code upload here plus a
        <Link to="route" target="_blank" rel="noopener noreferrer" className="text-blue-500">link</Link> to a detailed tutorial
      </div>
      <div className="mt-3">
        <UploadForm
          actionName="Verify Source Code"
          onSubmit={uploadFileToVerifier}
          accept={{
            "application/zip": [],
            "application/gzip": [],
            "application/x-bzip": []
          }}
        />
      </div>
    </div>
  )
}

export default function UnverifiedView (
  props : SourceTabProps
) {
  const [showMetadataUpload, setShowMetadataUpload] = useState(false)

  return <div className="mb-6">
    <ul className="my-2 mx-6 flex flex-wrap text-sm divide-x divide-blue-200 text-center">
      <li className="">
        <a href="#"
          onClick={(e) => {
            e.preventDefault()
            setShowMetadataUpload(false)
          }}
          className={classNames(
            "py-2 px-3 inline-block rounded-l border-y border-l border-blue-200",
            showMetadataUpload
              ? "hover:bg-gray-100"
              : "bg-blue-200 cursor-default"
          )}>
          Verifiable Package
        </a>
      </li>
      <li className="">
        <a href="#"
          onClick={(e) => {
            e.preventDefault()
            setShowMetadataUpload(true)
          }}
          className={classNames(
            "py-2 px-3 inline-block rounded-r border-y border-r border-blue-200",
            showMetadataUpload
              ? "bg-blue-200 cursor-default"
              : "hover:bg-gray-100"
          )}>
          Signed Metadata
        </a>
      </li>
    </ul>
    {showMetadataUpload
      ? <UploadSignedMetadata {...props} />
      : <UploadVerifiablePackage {...props} />}
  </div>
}
