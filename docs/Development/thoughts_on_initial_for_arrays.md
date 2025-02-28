Initial for Arrays
====================

Main issue with arrays and initial is the fact that the arrayrenderer itself is not mainly responsible for handling the data.
It recursively calls other renderers and is responsible for calling callbacks for adding and removing items.
Initial, on the other hand is a feature which the user can interact with one elmement and in turn have consequences for all elements -
where the initiator does not see the other elements.


Expected behavior
===================
In the ideal case, both editable true, and editable false, are supported. However, the second case may not be worth supporting.

True
-------
There, upon editing one, all elements are actually written into the data.

Note that the subrenderers likely (may depend on the implementation) cannot write the data themselves.
Since the list is not in the data, the data path (path in the ControlProps) is invalid.

False
--------
Questionable if this is user friendly. There, if one element is edited, all would disappear.


So this document focuses on the frist case only. The second case can be implemented somewhat analogously.



Things to notice
===============
There are two aspects to this entire endeavor. One is the data handling, in which all data is written down. The other
is the handling of the uischema.

Also, what needs to be considered, is the recusive case. You may be dealing with a list of objects.

The approach is as follows:

1) For the recusrive call, you need to inject the initial value for the specific element into the uischema. Remember, there is no data entry otherwhise.


2) The callback needs to be modifed.
Note that once the user edits one element, all elements need to actually write down the data.
This sibling-renderer communication is not allowed in json forms - or at least not supported directly with the API.

As such, the most reasonable path is to have the array renderer set the data itself. Thus, it actually needs to be notified when the childrenderer
tries to write down some data and prevent that. Since the arrayrenderer cannot explicitly pass the update callback, there needs to be some way to tell the 
control (or complex, in the recursive case) renderer to adapt its behavior. One way is the uischema.


Other Approaches That Could Be Explored
=========================================
Maybe the approach above could be simplified (not requiring uischema modification for part 2) by considering rewriting parts of the control or complexwrapper, which
are wrapped around the renderer when `export default`ing it.

Another one is to have an arraycontrol renderer which accepts string items only. In this case, it all becomes much more simple, but also a lot more limited.







