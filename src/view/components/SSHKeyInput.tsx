import React, { useEffect, useRef, useState } from 'react';
import useOutsideClick from '../hooks/useOutsideClick';

import { showError, showSuccess } from '../../controller/global/notification';
import ErrorBox from '../thirdparty/components/ifc/Label/ErrorBox';

interface SSHKeyProps {
  id: string;
  /** vays_options.initial */
  placeholder?: string;
  /** vays_options.initial_editable */
  placeholderEditable?: boolean;
  /** schema default */
  defaultv?: string;
  data?: string;
  enabled?: boolean;
  onChange: (v: string | undefined) => void;
}

// A single OpenSSH public key line: "<type> <base64> [comment]".
// Mirrors the YAC `ssh_key` format (ssh-rsa, ssh-ed25519, ecdsa-sha2-*).
const SSH_KEY_REGEX =
  /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-[\w-]+)\s+[A-Za-z0-9+/]+={0,3}(\s+\S.*)?$/;

/** True iff `value` is exactly one well-formed OpenSSH public key. */
export const isSingleSSHKey = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === '' || /[\r\n]/.test(trimmed)) return false;
  return SSH_KEY_REGEX.test(trimmed);
};

/** Why a value cannot be loaded, or '' if it is a valid single key (or empty). */
const validationError = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed === '' || isSingleSSHKey(trimmed)) return '';
  return /[\r\n]/.test(trimmed)
    ? 'Multiple keys are not allowed — provide a single OpenSSH public key.'
    : 'This is not a valid OpenSSH public key.';
};

/** Compact, human-readable summary of a (valid) key, or '' for an empty value. */
const compactDisplay = (keyValue: string): string => {
  const trimmed = keyValue.trim();
  if (trimmed === '') return '';
  if (!isSingleSSHKey(trimmed)) return trimmed;
  const list = trimmed.split(' ');
  return `${list[0]} (${list.length > 2 ? list[2] : ''}): ${list[1].substring(0, 20)}...`;
};

const SSHKeyInput = ({
  id,
  placeholder,
  placeholderEditable,
  defaultv,
  data,
  enabled,
  onChange,
}: SSHKeyProps) => {
  // Do not use handleChange, this is the version that is not debounced.
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve the effective value exactly like the plain text renderer:
  // default < editable-initial < data.
  let resolved = defaultv;
  if (placeholderEditable) resolved = placeholder ?? '';
  if (data != undefined) resolved = data;
  const resolvedKey = resolved != undefined ? resolved.toString() : '';

  // Greyed-out placeholder shown while the field is empty (non-editable
  // `initial` is surfaced here, just like in the text renderer).
  let ph = 'Edit or upload SSH Key...';
  if (!placeholderEditable) ph = placeholder ?? ph;

  const [key, setKey] = useState<string>(resolvedKey);
  const [value, setValue] = useState<string>(compactDisplay(resolvedKey));
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [error, setError] = useState<string>(validationError(resolvedKey));

  const makeEditable = () => {
    if (!enabled) return;
    setIsEditable(true);
    setValue(key);
  };

  const freezeInput = (keyValue: string, setChange: boolean = true) => {
    const trimmed = keyValue.trim();
    const err = validationError(trimmed);
    setKey(trimmed);
    setError(err);
    if (setChange) onChange(trimmed === '' ? undefined : trimmed);
    // Show the compact summary for valid keys; keep raw text visible otherwise
    // so the user can see (and fix) what is wrong.
    setValue(err === '' ? compactDisplay(trimmed) : trimmed);
    setIsEditable(false);
  };

  const loadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = (event.target.files as FileList)[0];
    // Reset so selecting the same file again still triggers onChange.
    event.target.value = '';
    if (!file) return;

    const fr = new FileReader();
    fr.onload = function () {
      const content = (fr.result as string).trim();
      const err = validationError(content);
      if (err !== '') {
        // Malformed or multi-key file: do not load it, just report the error.
        setError(err);
        showError('Could not load SSH key', err);
        return;
      }
      freezeInput(content);
    };
    fr.readAsText(file);
  };

  useOutsideClick(inputRef, () => {
    if (isEditable) {
      freezeInput(key);
    }
  });

  /**
   * caching fix: re-sync when the resolved value changes (e.g. external data
   * updates, or initial/default resolution).
   */
  useEffect(() => {
    freezeInput(resolvedKey, false);
  }, [resolvedKey]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = value;
  }, [value]);

  return (
    <>
      <div id={id}>
        <div className="flex flex-row w-full">
          <div className="flex w-16 items-center justify-center bg-primary rounded-l">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e8eaed"
            >
              <path d="M280-400q-33 0-56.5-23.5T200-480q0-33 23.5-56.5T280-560q33 0 56.5 23.5T360-480q0 33-23.5 56.5T280-400Zm0 160q-100 0-170-70T40-480q0-100 70-170t170-70q67 0 121.5 33t86.5 87h352l120 120-180 180-80-60-80 60-85-60h-47q-32 54-86.5 87T280-240Zm0-80q56 0 98.5-34t56.5-86h125l58 41 82-61 71 55 75-75-40-40H435q-14-52-56.5-86T280-640q-66 0-113 47t-47 113q0 66 47 113t113 47Z" />
            </svg>
          </div>
          <input
            type="file"
            id={id + 'sshkey'}
            className="hidden"
            accept=".pub, text"
            onChange={(e) => loadFile(e)}
          />
          <div
            className={`grow flex flex-row w-full rounded-r-md border bg-bg pl-5 pr-2 py-2.5 outline-none ${
              isEditable && enabled ? 'focus:border-primary' : 'border-stroke'
            }`}
          >
            <input
              ref={inputRef}
              type={'text'}
              disabled={!isEditable || !enabled}
              className="border-none grow bg-transparent focus:border-none focus:outline-none"
              defaultValue={value}
              placeholder={ph}
              onChange={(e) => {
                if (isEditable) {
                  setKey(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  freezeInput(key);
                }
              }}
            />
            <div
              className="flex w-8 items-center justify-center cursor-pointer"
              onClick={() => {
                makeEditable();
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 10);
              }}
            >
              <button title="Edit">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="grey"
                >
                  <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                </svg>
              </button>
            </div>

            <div className="flex w-8 items-center justify-center cursor-pointer">
              <button
                title="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(key).then(
                    function () {
                      showSuccess('Copied to clipboard!', `Copied '${key}'`);
                    },
                    function (err) {
                      showError('Cannot copy to clipboard!', err);
                    },
                  );
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="grey"
                >
                  <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
                </svg>
              </button>
            </div>
          </div>
          <label
            htmlFor={id + 'sshkey'}
            title="Select SSH key file"
            className="flex w-16 items-center justify-center cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="grey"
            >
              <path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
            </svg>
          </label>
        </div>
        <ErrorBox displayError={error} />
      </div>
    </>
  );
};

export default SSHKeyInput;
