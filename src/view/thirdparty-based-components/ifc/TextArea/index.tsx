const TextArea = () => {
  return (
    <textarea
      rows={6}
      placeholder="Default textarea"
      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-plainfont outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
    ></textarea>
  );
};

export default TextArea;
