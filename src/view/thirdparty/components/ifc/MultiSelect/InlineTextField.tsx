const InlineTextField = ({
  numItemsInList,
  inputRef,
  currentInput,
  onChange,
  onKeyDown,
  placeHolder,
}: {
  numItemsInList: number;
  inputRef: React.RefObject<HTMLInputElement>;
  currentInput: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  placeHolder: string;
}) => {
  return (
    <div
      className="flex flex-row grow relative items-center pl-1 pr-1 z-0"
      style={{ minWidth: numItemsInList > 0 ? 120 : '90%', minHeight: 36 }}
    >
      <label
        className="outline-none border-none grow"
        style={{
          position: 'absolute',
          minWidth: numItemsInList > 0 ? 80 : '90%',
          top: numItemsInList > 0 ? 10 : 4,
        }}
      >
        <span style={{ whiteSpace: 'pre', padding: 0 }}>{currentInput}</span>
        <input
          ref={inputRef}
          className="absolute grow focus:outline-none focus:border-none w-full bg-transparent"
          style={{
            padding: 0,
            margin: 0,
            left: 0,
            top: 0,
          }}
          placeholder={placeHolder}
          type="text"
          value={currentInput}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </label>
    </div>
  );
};

export default InlineTextField;
