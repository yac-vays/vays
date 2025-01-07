import { useRef } from 'react';
import { useFloating, autoUpdate, offset, flip, arrow, FloatingArrow } from '@floating-ui/react';

const InfoPanel = ({
  children,
  show,
  title,
  description,
}: {
  children: React.ReactNode;
  show: boolean;
  title?: string;
  description?: string;
}) => {
  const arrowRef = useRef(null);
  const { refs, floatingStyles, context, placement } = useFloating({
    placement: 'right',
    open: show,
    middleware: [
      arrow({
        element: arrowRef,
      }),
      offset(10),
      flip({
        fallbackPlacements: ['right', 'top', 'bottom'],
        fallbackStrategy: 'initialPlacement',
        flipAlignment: false,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <>
      <div ref={refs.setReference}>{children}</div>

      {show ? (
        // https://austencam.com/posts/quick-tip-fixing-initial-position-and-transitions-with-floating-ui
        <div className="absolute top-0 left-0 z-50" ref={refs.setFloating} style={floatingStyles}>
          <FloatingArrow
            ref={arrowRef}
            context={context}
            style={
              placement.startsWith('right')
                ? { left: 0 }
                : placement.startsWith('top')
                ? {}
                : { top: -14 }
            }
            tipRadius={3}
            className="dark:fill-white"
          />
          <div className="border z-50 rounded ml-3 w-max max-w-[300px] bg-white drop-shadow-xl dark:bg-meta-4">
            <div className="p-3">
              <h4 className="text-center text-title-sm font-bold text-solid">{title}</h4>
            </div>
            <div className="px-5 pt-1 pb-5 text-center">
              <p className="font-medium">{description}</p>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
      {/* </div>
      </div> */}
    </>
  );
};

// import './styles.css';

// function Popover() {
//   const [isOpen, setIsOpen] = useState(false);

//   const { refs, floatingStyles, context } = useFloating({
//     open: isOpen,
//     onOpenChange: setIsOpen,
//     middleware: [offset(10), flip({ fallbackAxisSideDirection: 'end' }), shift()],
//     whileElementsMounted: autoUpdate,
//   });

//   const click = useClick(context);
//   const dismiss = useDismiss(context);
//   const role = useRole(context);

//   const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

//   const headingId = useId();

//   return (
//     <>
//       <button ref={refs.setReference} {...getReferenceProps()}>
//         Add review
//       </button>
//       {isOpen && (
//         <FloatingFocusManager context={context} modal={false}>
//           <div
//             className="Popover"
//             ref={refs.setFloating}
//             style={floatingStyles}
//             aria-labelledby={headingId}
//             {...getFloatingProps()}
//           >
//             <h2 id={headingId}>Review balloon</h2>
//             <textarea placeholder="Write your review..." />
//             <br />
//             <button
//               style={{ float: 'right' }}
//               onClick={() => {
//                 console.log('Added review.');
//                 setIsOpen(false);
//               }}
//             >
//               Add
//             </button>
//           </div>
//         </FloatingFocusManager>
//       )}
//     </>
//   );
// }

// export default function App() {
//   return (
//     <div className="App">
//       <h1>Floating UI Popover</h1>
//       <Popover />
//     </div>
//   );
// }

export default InfoPanel;
