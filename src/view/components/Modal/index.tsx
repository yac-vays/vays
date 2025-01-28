import { Component, DetailedHTMLProps, InputHTMLAttributes } from 'react';
import React from 'react';
import Checkbox from '../../thirdparty-based-components/ifc/CheckBox/CheckBox';
import { ActionDecl } from '../../../model/EntityListFetcher';

export type CallbackSuccessType = (
  enteredName?: string,
  actionsSelected?: ActionDecl[],
) => Promise<void>;

interface ConfirmationModalState {
  show: boolean;
  title: string;
  confirmVerb: string;
  callbackSuccess: CallbackSuccessType;
  callbackCancel: () => Promise<void>;
  text: string;
  isSending: boolean;
  textInputEnabled: boolean;
  actions: ActionDecl[];
  actionsChoice: any;
}

interface ConfirmationModalProps {}

class ConfirmAlert extends Component<ConfirmationModalProps, ConfirmationModalState> {
  private ref: React.RefObject<HTMLDivElement>;
  private textInputRef: React.RefObject<HTMLInputElement>;
  private blockConfirm: boolean;

  constructor(props: any) {
    super(props);
    this.state = {
      title: '',
      confirmVerb: 'confirm',
      callbackSuccess: async () => {},
      callbackCancel: async () => {},
      text: 'Are you sure you want to proceed?',
      show: false,
      isSending: false,
      textInputEnabled: false,
      actions: [],
      actionsChoice: [],
    };
    this.ref = React.createRef();
    this.textInputRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleEscapeButton = this.handleEscapeButton.bind(this);
    this.blockConfirm = false;
  }

  componentDidMount(): void {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('keydown', this.handleEscapeButton);
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleEscapeButton);
  }

  handleClickOutside(event: Event): void {
    if (this.ref.current && !this.ref.current.contains(event.target as Node)) {
      this.state.callbackCancel().then((res) => {
        this.hide();
      });
    }
  }

  handleEscapeButton(
    event: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  ): void {
    if (!this.state.show) return;
    if ((event as KeyboardEvent).code === 'Escape') {
      // this.state.callbackCancel();
      // this.hide();
      this._cancel();
    } else if ((event as KeyboardEvent).code === 'Enter') {
      this._confirm();
    }
  }

  _confirm() {
    if (this.blockConfirm) return;
    this.blockConfirm = true;
    this._setSending(true);
    const finish = (res: any) => {
      this._setSending(false);
      this.hide();
    };
    if (!this.state.textInputEnabled) this.state.callbackSuccess().then(finish);
    else
      this.state
        .callbackSuccess(
          this.textInputRef.current?.value,
          this.state.actions.filter((v, i) => this.state.actionsChoice[i]),
        )
        .then(finish);
  }

  _cancel() {
    this.state.callbackCancel().then((res) => {
      this.hide();
    });
  }

  show(
    title: string,
    text: string,
    callbackSuccess: () => Promise<void>,
    callbackCancel: () => Promise<void>,
    confirmVerb: string,
    enableTextInput: boolean,
    actions?: ActionDecl[],
  ): void {
    this.blockConfirm = false;
    if (actions == undefined) actions = [];
    this.setState({
      title: title,
      confirmVerb: confirmVerb,
      callbackSuccess: callbackSuccess,
      callbackCancel: callbackCancel,
      text: text,
      show: true,
      isSending: false,
      textInputEnabled: enableTextInput,
      actions: actions,
      actionsChoice: actions.map(() => false),
    });
    // Requires slight delay to take effect
    setInterval(() => this.textInputRef.current?.focus(), 16);
  }

  hide(): void {
    let stateCopy: ConfirmationModalState = { ...this.state };
    stateCopy.show = false;
    this.setState(stateCopy);
    if (this.textInputRef.current != undefined) this.textInputRef.current.value = '';
  }

  private _setSending(value: boolean): void {
    let stateCopy: ConfirmationModalState = { ...this.state };
    stateCopy.isSending = value;
    this.setState(stateCopy);
  }
  render() {
    return (
      <>
        <div
          className={`fixed left-0 top-0 z-99999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5 ${
            this.state.show ? 'block' : 'hidden'
          }`}
        >
          <div
            ref={this.ref}
            className="relative md:px-10 w-full max-w-180 rounded bg-white px-10 py-8 dark:bg-boxdark md:py-8"
          >
            <div className="flex flex-row">
              <div className="grow">
                <h3 className="text-xl font-bold text-plainfont sm:text-2xl mt-0 pb-2 mr-14">
                  {this.state.title}
                </h3>
                <p className="font-medium mb-4 whitespace-pre-line hyphens-auto">
                  {this.state.text}
                </p>
              </div>
              <div className="mr-2 pt-2 fill-danger" style={{ right: 0 }}>
                <span className="mx-auto inline-block">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="48px"
                    viewBox="0 -960 960 960"
                    width="48px"
                  >
                    <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                  </svg>
                </span>
              </div>
            </div>
            <>
              {this.state.textInputEnabled ? (
                <div>
                  <input
                    ref={this.textInputRef}
                    type="text"
                    className="w-full rounded-md border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary dark:text-white"
                    placeholder="Enter Name..."
                  />
                </div>
              ) : (
                <></>
              )}
              <div className="h-3"></div>
              <div className="flex flex-row w-full items-center">
                <>
                  {/* Function keyword usage here would shadow the 'this' pointer with the container. */}
                  {(() => {
                    const jsx = [];
                    let i = 0;
                    for (const act of this.state.actions) {
                      jsx.push(
                        <>
                          <Checkbox
                            title={act.title}
                            initValue={this.state.actionsChoice[i]}
                            onChange={() => {
                              this.state.actionsChoice[i] = !this.state.actionsChoice[i];
                            }}
                            minified
                          />
                          <div className="h-2 w-10"></div>
                        </>,
                      );
                    }

                    return jsx;
                  })()}
                </>
              </div>
              <div className="h-4"></div>
            </>
            <div className="-mx-3 flex flex-wrap gap-y-2">
              <div className="w-1/2 h-full px-3">
                <button
                  className="w-full rounded border border-stroke bg-primary-5 p-3 text-center font-medium text-plain transition hover:border-meta-4 hover:bg-meta-4 hover:text-white dark:border-strokedark dark:bg-meta-4 dark:hover:border-danger dark:hover:bg-danger hover:scale-105"
                  onClick={() => this._cancel()}
                >
                  Cancel
                </button>
              </div>
              <div className="w-1/2 px-3">
                <button
                  className="w-full rounded border border-stroke dark:border-stroke bg-danger dark:bg-meta-4 p-3 text-center font-medium text-white transition hover:bg-danger hover:border-danger hover:dark:bg-danger hover:scale-105"
                  onClick={() => this._confirm()}
                >
                  {this.state.isSending ? (
                    <>
                      <div className="relative">
                        <div className="absolute h-6 w-6 animate-spin rounded-full border-4 border-solid border-white border-t-transparent mt-0"></div>
                      </div>
                      Sending...
                    </>
                  ) : (
                    this.state.confirmVerb
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default ConfirmAlert;
